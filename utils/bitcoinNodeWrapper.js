import RPCClient from 'rpc-client';

export default class BitcoinNodeWrapper {
    constructor({url, user, password}) {
        const uri = new URL(url);
        this.client = new RPCClient({
            host: uri.hostname,
            port: uri.port,
            protocol: uri.protocol
        });
        this.client.setBasicAuth(user, password);
    }

    async call(method, params = null){
        return new Promise((resolve, reject) => {
            this.client.call(method, params, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
    }

    async getLastBlock() {
        try {
            const res = await this.call('getblockchaininfo');
            return res && res.blocks;
        } catch (e) {
            console.error("Error reading last block");
            console.error(e);
        }
    }

    async getBlockChangedAddresses(blockNumber) {
        try {
            const blockHash = await this.call('getblockhash', [blockNumber]);

            if (!blockHash) return [];

            const block = await this.call('getblock', [blockHash, 2]);
            const adrResult = [];

            if (block && block.tx) {
                (block.tx || []).forEach(tx => {
                    const isCoinbase = tx.vin && tx.vin[0] && tx.vin[0].coinbase;

                    if (!isCoinbase) {
                        (tx.vout || []).forEach(out => {
                            const receiver = out.scriptPubKey && out.scriptPubKey.addresses && out.scriptPubKey.addresses[0];

                            if (receiver) {
                                adrResult.push(receiver);
                            }
                        });
                    }
                });
            }

            return adrResult;

        } catch (e) {
            console.error("error getting blockhash")
            console.error(e);
        }
    }

    async getAddressDetail(adrList, blockHeight) {
        try {
            const utxoResult = await this.call('listunspent', [0, 9999999, adrList]);
            let addresses = [];
            //console.log("utxo");
            //console.log(utxoResult);

            (utxoResult || []).forEach(tx => {
                let adrDetail = addresses.find(adr => adr.address == tx.address);
                if (adrDetail == null) {
                    adrDetail = {
                        address: tx.address,
                        balance: 0,
                        transfers: [],
                        utxos: []
                    };
                    addresses.push(adrDetail);
                }

                if (tx.safe === true) {
                    adrDetail.balance += Number(tx.amount)*1e8;
                    adrDetail.utxos.push({
                        transactionHash: tx.txid,
                        index: tx.vout,
                        value: Number(tx.amount)*1e8
                    });
                    adrDetail.transfers.push({
                        txHash: tx.txid,
                        address: tx.address,
                        value: Number(tx.amount)*1e8,
                        confirmation: tx.confirmations,
                        isReceive: true,
                    });
                }

            });

            return addresses;

        } catch (e) {
            console.error("error getting tx details");
            console.error(e);
            return [];
        }
    }

    async getRawTx(txId) {
        try {
            const res = await this.call("gettransaction", [txId, true]);

            if (res) {

                const vout = (res.details || []).map(el => {
                    return {
                        value: Number(el.amount) * 1e8,
                        address: el.address,
                        vout: el.vout
                    }
                })

                return {
                    hex: res.hex,
                    confirmations: res.confirmations,
                    value: Number(res.amount) * 1e8,
                    vout: vout
                };

            }
        } catch (e) {
            console.error("error getting rawtx")
            console.error(e);
        }
    }

    async sendRawTransaction(hex) {
        return await this.call('sendrawtransaction', [hex]);
    }

    /**
     *
     * @param {Array<Payment>} paymentAddressList
     * @returns {Promise<void>}
     */
    async importNewAddress(paymentAddressList) {
        try {
            const req = paymentAddressList.map(payment => {
                return {
                    scriptPubKey: {address: payment.address},
                    timestamp: "now",
                    //witnessscript: payment.redeem.output.toString('hex'),
                    redeemscript: payment.redeem.output.toString('hex'),
                    watchonly: true,
                    label: payment.label
                };
            });

            const res = await this.call('importmulti', [req, {rescan: false}]);

            console.log("import addr", res);
        } catch (e) {
            console.error("error importing address");
            console.error(e);
        }
    }

    /**
     *
     * @param {Payment} payment
     * @param {Date} createdDate
     */
    async checkImportAddress(payment, label, createdDate, rescan = false) {
        try {
            const addressInfo = await this.call('getaddressinfo', [payment.address]);

            if (addressInfo == null || !addressInfo.pubkeys) {
                const req = [{
                    scriptPubKey: {address: payment.address},
                    timestamp: createdDate.getTime(),
                    redeemscript: payment.redeem.output.toString('hex'),
                    watchonly: true,
                    label: label
                }];

                const res = await this.call('importmulti', [req, {rescan: rescan === true}]);

                return res && res[0] && res[0].success === true;
            }

            if (addressInfo && (addressInfo.labels || []).indexOf(label) < 0) {
                await this.call('setlabel', [payment.address, label]);
            }


            return true;
        } catch (e) {
            console.error("Error check importing address")
            console.error(e);
        }
    }

    async getMemPoolTxs() {
        try {
            const mempoolTxIds = await this.call('getrawmempool', [false]);
            const txList = [];

            if (mempoolTxIds && mempoolTxIds.length > 0) {
                for (let i = 0; i < mempoolTxIds.length; i++) {
                    //console.log("array length: "+mempoolTxIds.length+" index "+i+" id: "+mempoolTxIds[i]);
                    //const tx = await this.call('getrawtransaction', [mempoolTxIds[i], true]);


                    let tx;

                    try {
                        tx = await this.call('getrawtransaction', [mempoolTxIds[i], true]);
                    } catch (e) {
                        //console.error("cant get raw tx");
                        //console.error(e);
                    }


                    if (tx && tx.txid) {
                        const out = (tx.vout || []).map(out => {
                            if (out.value > 0 && out.scriptPubKey.addresses) {
                                return {
                                    value: out.value * 1e8,
                                    address: out.scriptPubKey.addresses[0]
                                };
                            }
                        }).filter(o => o != null);

                        if (out.length > 0) {
                            txList.push({
                                txId: tx.txid,
                                out: out
                            });
                        }
                    }
                }
            }

            return txList;
        } catch (e) {
            console.error("error getting tx from mempool")
            console.error(e);
            return [];
        }
    }

    async listReceivedTxsByLabel(label, count = 100) {
        try {
            const txList = await this.call('listtransactions', [label, count, 0, true]);

            const received = (txList || []).map(tx => {
                if (tx && tx.category === 'receive') {
                    return {
                        txHash: tx.txid,
                        blockNumber: tx.blockheight,
                        address: tx.address,
                        value: Number(tx.amount) * 1e8,
                        confirmations: tx.confirmations
                    };
                }
            })

            return received.filter(tx => tx != null);

        } catch (e) {
            console.error(e);
            return [];
        }
    }

}

