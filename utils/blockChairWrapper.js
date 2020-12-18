import axios from 'axios';

class BlockChairWrapper {
    constructor(apiKey, isMainNet = true) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.blockchair.com';
        this.chain = isMainNet ? 'bitcoin' : 'bitcoin/testnet';
    }

    /**
     *
     * @param path
     * @param params
     * @returns {Promise<any>}
     * @private
     */
    async call(path, params = {}) {
        try {
            params = params || {};
            if (this.apiKey) {
                params.key = this.apiKey;
            }

            const res = await axios.get(`${this.baseUrl}/${this.chain}/${path}`, {
                params: params
            });

            return res && res.data && res.data.data;
        } catch (e) {
            console.log(e);
            return Promise.reject(e);
        }
    }

    async post(path, data = {}) {
        try {
            const params = {};
            if (this.apiKey) {
                params.key = this.apiKey;
            }

            const res = await axios.post(`${this.baseUrl}/${this.chain}/${path}`, data, {
                params: params
            });

            return res && res.data && res.data.data;
        } catch (e) {
            console.log(e);
            return Promise.reject(e);
        }
    }

    async getLastBlock() {
        try {
            const stats = await this.call('stats');

            return stats && stats['best_block_height'];
        } catch (e) {
            console.log(e);
        }
    }

    async getBlockChangedAddresses(blockNumber) {
        try {
            const changes = await this.call('state/changes/block/' + blockNumber);

            if (changes == null) return [];

            return Object.keys(changes);
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    /**
     *
     * @param { string[] } adrList
     * @param blockHeight
     * @returns {Promise<*[]>}
     */
    async getAddressDetail(adrList, blockHeight) {
        try {
            const txsInfo = await this.call('dashboards/addresses/' + adrList.join(','), {transaction_details: true});
            let addresses = [];

            Object.keys(txsInfo && txsInfo.addresses).forEach(adr => {
               addresses.push({
                   address: adr,
                   balance: txsInfo.addresses[adr].balance,
                   balanceUsd: txsInfo.addresses[adr].balance_usd,
                   transfers: [],
                   utxos: []
               })
            });

            (txsInfo && txsInfo.transactions || []).forEach(tx => {
                if (tx && (blockHeight == null || tx.block_id === blockHeight)) {
                    const addressInfo = addresses.find(a => a.address === tx.address);
                    const val = Math.abs(tx.balance_change);

                    if (addressInfo) {
                        addressInfo.transfers.push({
                            txHash: tx.hash,
                            address: tx.address,
                            value: val,
                            confirmation: tx.block_id,
                            isReceive: tx.balance_change > 0
                        })
                    }
                }
            });

            (txsInfo && txsInfo.utxo || []).forEach(utxo => {
                const addressInfo = addresses.find(a => a.address === utxo.address);
                if (addressInfo) {
                    addressInfo.utxos.push({
                        transactionHash: utxo.transaction_hash,
                        index: utxo.index,
                        value: utxo.value
                    });
                }
            });

            return addresses;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    async getRawTx(txId) {
        try {
            const res = await this.call('raw/transaction/' + txId);

            if (res && res[txId]) {
                return {
                    hex: res[txId].raw_transaction,
                    decoded: res[txId].decoded_raw_transaction
                }
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    }
    async sendRawTransaction(hex) {
        try {
            const res = await this.post('push/transaction', {data: hex});

            return res && res.transaction_hash;
        } catch (e) {
            console.error(e);
        }
    }
}

export default BlockChairWrapper;
