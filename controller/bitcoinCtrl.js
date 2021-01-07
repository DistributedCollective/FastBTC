import * as bip39 from 'bip39';
import {bip32, networks, payments} from 'bitcoinjs-lib';
import {default as ConfigStore} from 'configstore';
import path from 'path';
import * as _ from 'lodash';
import config from '../config/config';
//import BlockChairWrapper from '../utils/blockChairWrapper';
import dbCtrl from "./dbCtrl";
import U from '../utils/helper';
import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";


class BitcoinCtrl {
    async init() {
        // this.api = new BlockChairWrapper(config.blockChairKey, this.isMainNet);
        this.isMainNet = config.env === 'prod';
        this.api = new BitcoinNodeWrapper(config.node);
        this.storage = new ConfigStore( 'store', null, {
            configPath: path.join(__dirname, '../config/store.json')
        });

        setInterval(() => this.checkPendingTx(), 60000);
    }

    get network() {
        return this.isMainNet ? networks.bitcoin : networks.testnet;
    }

    get derivationPath() {
        return this.isMainNet ? "m/49'/0'/0'" : "m/49'/1'/0'";
    }

    async createAddress(index) {
        const publicKeys = config.walletSigs.pubKeys.map(key => {
            const node = bip32.fromBase58(key, this.network);
            const child = node.derive(0).derive(index);
            return child.publicKey;
        });

        const payment = payments.p2wsh({
            network: this.network,
            redeem: payments.p2ms({
                m: 2,
                pubkeys: publicKeys,
                network: this.network
            })
        });
        await this.api.importAddress([payment]);

        return payment.address;
    }

    async checkAddress(index, createdDate) {
        const publicKeys = config.walletSigs.pubKeys.map(key => {
            const node = bip32.fromBase58(key, this.network);
            const child = node.derive(0).derive(index);
            return child.publicKey;
        });

        const payment = payments.p2wsh({
            network: this.network,
            redeem: payments.p2ms({
                m: 2,
                pubkeys: publicKeys,
                network: this.network
            })
        });

        return await this.api.checkImportAddress(payment, createdDate);
    }

    async getAllTxWrapper(cb) {
        while (true) {
            const storedBlock = this.storage.get('lastBlockNumber');
            const curBlockOnNet = await this.api.getLastBlock();
            console.log("Processing block "+curBlockOnNet);

            if (curBlockOnNet > storedBlock) {
                console.log("Behind %s blocks", curBlockOnNet - storedBlock);
                for (let block = storedBlock+1; block <= curBlockOnNet; block++) {
                    try {
                        let tx = await this.getTxOnBlock(block);

                        if (tx && tx.length > 0) {
                            const exists = await dbCtrl.findTx(tx.map(t => t.txHash));
                            if (exists && exists.length > 0) {
                                tx = tx.filter(t => {
                                   return exists.find(t1 => t1.status === 'confirmed' && t1.txHash === t.txHash) == null;
                                });
                            }

                            cb(tx);
                        }
                    } catch (e) {}
                    this.storage.all = {
                        lastBlockNumber: block
                    };

                    await U.wasteTime(10);
                }
            }

            await U.wasteTime(60*3);
        }
    }

    async getTxOnBlock(blockNumber) {
        try {
            console.log("# Checking block #%s", blockNumber);
            const addresses = await this.api.getBlockChangedAddresses(blockNumber);

            if (addresses == null || addresses.length === 0) return [];

            const users = await dbCtrl.findUsersByAdrList(addresses);
            let txList = [];
            console.log("block has %s adr changes, %s users on db", addresses.length, users.length);

            if (users && users.length > 0) {
                const userAddresses = _.uniq(users.map(u => u.btcadr));
                const addressDetails = await this.api.getAddressDetail(userAddresses, blockNumber);
                const btcPrice = await U.getBTCPrice();

                (addressDetails || []).forEach(adrDetail => {
                    const user = users.find(u => u.btcadr === adrDetail.address);

                    if (user) {
                        (adrDetail.transfers || []).forEach(tx => {
                            if (tx.isReceive && tx.confirmation > 0) {
                                txList.push({
                                    address: user.btcadr,
                                    label: user.label,
                                    txHash: tx.txHash,
                                    conf: tx.confirmation,
                                    val: tx.value,
                                    usd: Number(tx.value) * btcPrice/1e8
                                });
                            }
                        });
                    }
                });

            }

            return txList;
        } catch (e) {
            console.error("error getting tx on block")
            console.error(e);
            return [];
        }
    }

    async checkPendingTx() {
        try {
            const txList = await this.api.getMemPoolTxs();

            if (txList && txList.length > 0) {
                const btcPrice = await U.getBTCPrice();
                // console.log("Pending tx", txList.length);

                for (let tx of txList) {
                    const addresses = tx.out.map(o => o.address);
                    const users = await dbCtrl.findUsersByAdrList(addresses);

                    if (users && users.length > 0) {
                        const depositedUser = users[0];
                        const out = tx.out.find(o => o.address === depositedUser.btcadr);
                        const value = out.value || 0;
                        const valUsd = value * btcPrice/1e8;
                        const added = await dbCtrl.getDeposit(tx.txId);

                        if (added == null) {
                            console.log("user %s has a deposit, tx %s, value %s", depositedUser.btcadr, tx.txId, value);

                            await dbCtrl.addDeposit(depositedUser.label, tx.txId, value, valUsd);

                            if (this.onPendingDepositHandler) {
                                this.onPendingDepositHandler(depositedUser.label, {
                                    txHash: tx.txId,
                                    value: value,
                                    status: 'pending'
                                });
                            }
                        }
                    }
                }
            }

        } catch (e) {
            console.error("error checking pending tx");
            console.error(e);
        }
    }

    onPendingDeposit(handler) {
        this.onPendingDepositHandler = handler;
    }
}

export default new BitcoinCtrl();
