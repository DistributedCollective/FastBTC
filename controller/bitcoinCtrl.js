import {bip32, networks, payments} from 'bitcoinjs-lib';
import conf from '../config/config';
import dbCtrl from "./dbCtrl";
import U from '../utils/helper';
import telegramBot from '../utils/telegram';
import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";
import loggingUtil from '../utils/loggingUtil';

var b58 = require('bs58check')

class BitcoinCtrl {
    constructor() {
        this.onTxDepositedHandler = async () => {};
        this.onPendingDepositHandler = async () => {};
        
        this.isMainNet = conf.env === 'prod';
        this.pubKeys = conf.walletSigs.pubKeys;
        this.cosigners = conf.walletSigs.cosigners;
        this.thresholdConfirmations = conf.thresholdConfirmations;
        this.api = new BitcoinNodeWrapper(conf.node);
        this.network = this.isMainNet ? networks.bitcoin : networks.testnet;

        // stores unknown labels => the times we've complained about them
        this.unknownLabels = new Map();
    }

    getDerivedPubKeys(index) {
        let publicKeys = this.pubKeys.map(key => {
            const k = this.zpubToXpub(key);
            const node = bip32.fromBase58(k, this.network);
            const child = node.derive(0).derive(index);
            return child.publicKey.toString('hex');
        });
        publicKeys.sort();
        publicKeys = publicKeys.map(k => Buffer.from(k, 'hex'));
        return publicKeys;
    }

    zpubToXpub(zpub) {
        let data = b58.decode(zpub).slice(4)

        if (zpub.startsWith('Vpub') || zpub.startsWith('vpub') || zpub.startsWith('tpub') || zpub.startsWith('Tpub')) {
            data = Buffer.concat([Buffer.from('043587cf', 'hex'), data])
        } else {
            data = Buffer.concat([Buffer.from('0488b21e', 'hex'), data])
        }

        return b58.encode(data)
      }

    async createAddress(index, label) {
        console.log("create payment address key for "+index+" "+label);
        const publicKeys = this.getDerivedPubKeys(index);
        
        const payment = payments.p2wsh({
            network: this.network,
            redeem: payments.p2ms({
                m: this.cosigners,
                pubkeys: publicKeys,
                network: this.network
            })
        });  
        payment.label = label;
        await this.api.importNewAddress([payment]);

        return payment.address;
    }

    async checkAddress(index, label, createdDate, rescan = false) {
        const publicKeys = this.getDerivedPubKeys(index);

        const payment = payments.p2wsh({
            network: this.network,
            redeem: payments.p2ms({
                m: this.cosigners,
                pubkeys: publicKeys,
                network: this.network
            })
        });

        return await this.api.checkImportAddress(payment, label, createdDate, rescan);
    }

    setPendingDepositHandler(handler) {
        this.onPendingDepositHandler = handler;
    }

    setTxDepositedHandler(handler) {
        this.onTxDepositedHandler = handler;
    }

    async addPendingDepositTx({ address, value, txId, label, vout }) {
        try {
            const user = await dbCtrl.getUserByBtcAddress(address);

            if (! user) {
                console.log("no user for address %s", address);
                return;
            }

            let added = await dbCtrl.getDeposit(txId, label, vout);

            // try finding one with -1 vout, so that we do not mess
            // the original database!
            if (added == null) {
                added = await dbCtrl.getDeposit(txId, label, -1);
                if (added) {
                    console.warn(
                        "found a deposit tx %s for label %s without vout fix",
                        txId,
                        label
                    );
                }
            }

            if (added == null) {
                const msg = `user ${user.btcadr} (label ${label}) has a pending deposit, tx ${txId}/${vout}, value ${(value / 1e8)} BTC`

                telegramBot.sendMessage(msg);

                await dbCtrl.addDeposit(user.label, txId, value, false, vout);

                await this.onPendingDepositHandler(user.label, {
                    txHash: txId,
                    value: value,
                    status: 'pending',
                    vout: vout,
                });
            }

        } catch (e) {
            console.error(e);
        }
    }

    async depositTxConfirmed({ address, value, txId, confirmations, label, vout }) {
        try {
            const user = await dbCtrl.getUserByBtcAddress(address);
            let confirmedInDB = await dbCtrl.getDeposit(txId, label, vout);
            if (! confirmedInDB) {
                confirmedInDB = await dbCtrl.getDeposit(txId, label, -1);
            }

            if (user != null && (confirmedInDB == null || confirmedInDB.status !== 'confirmed')) {
                // it's *async* - but let's do it like this anyway
                this.onTxDepositedHandler({
                    address: user.btcadr,
                    label: user.label,
                    txHash: txId,
                    conf: confirmations,
                    val: value,
                    vout: vout,
                }).catch(e => {
                    console.error('tx deposit handling met an error:', e);
                }).then(function () {
                    console.log('tx deposit handled successfully')
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Check deposit transactions for all user addresses in DB.
     * It gets incoming transactions from the node by user label. If tx has 0 confirmations, add a pending tx to db
     * Otherwise check it is confirmed when has more than [thresholdConfirmations] confirmations
     */
    async checkDepositTxs() {
        const addrLabels = new Set(await dbCtrl.getUserLabels(-1, -1));
        const blockBookmark = await dbCtrl.getBookmark(
            "block_bookmark",
            null
        );

        const since = await this.api.listDepositsSinceBlock(
            blockBookmark,
            conf.maxConfirmationsToTrack,
        );

        const txList = (since.transactions || []).filter(tx => {
            if (! addrLabels.has(tx.label)) {
                this.complainAboutUnknownLabel(tx.label);
                return false;
            }
            return true;
        });

        const summary = txList.reduce((summary, tx) => {
            summary.unconfirmed += tx.confirmations === 0;
            summary.confirmed += tx.confirmations > 0;
            summary.total ++;
            return summary;
        }, { unconfirmed: 0, confirmed: 0, total: 0 });

        loggingUtil.logUnique(
            "btc deposit counts",
            `${summary.total} btc deposits in the window - `
            + `${summary.confirmed} confirmed, `
            + `${summary.unconfirmed} unconfirmed. Minimal scan depth `
            + `${conf.maxConfirmationsToTrack} blocks`
        )

        for (const tx of txList) {
            const confirmations = tx && tx.confirmations;

            if (! addrLabels.has(tx.label)) {
                console.log("ignoring unknown label %s", tx.label);
                continue;
            }

            if (confirmations === 0) {
                await this.addPendingDepositTx({
                    address: tx.address,
                    value: tx.value,
                    txId: tx.txId,
                    label: tx.label,
                    vout: tx.vout,
                });
            } else if (confirmations >= this.thresholdConfirmations) {
                await this.depositTxConfirmed({
                    address: tx.address,
                    value: tx.value,
                    txId: tx.txId,
                    confirmations: confirmations,
                    label: tx.label,
                    vout: tx.vout,
                });
            }
        }

        if (since.lastblock) {
            // If we got a sensible last block then store it here.
            await dbCtrl.setBookmark(
                "block_bookmark",
                since.lastblock,
            );
        }
    }

    /**
     * Async infinite loop checking BTC deposits
     *
     * @returns {Promise<void>}
     */
    async depositCheckLoop() {
        while (true) {
            // delay 5 seconds from *this* time.
            const delayer = U.wasteTime(5);
            try {
                await this.checkDepositTxs();
            }
            catch (e) {
                console.error("checkDepositTxs errored out", e);
            }
            await delayer;
        }
    }

    /**
     * Start the infinite async loop checking BTC deposits
     */
    startDepositCheckLoop() {
        this.depositCheckLoop().then(() => {
            console.log("deposit check loop exited (how did that happen?)");
        });
    }

    complainAboutUnknownLabel(label) {
        const timeout = this.unknownLabels.get(label)

        if (! timeout || timeout < Date.now()) {
            console.log("ignoring unknown label %s", label);

            // 1.5 hours
            this.unknownLabels.set(label, Date.now() + 1.5 * 60 * 60 * 1000);
        }
    }
}

export default new BitcoinCtrl();
