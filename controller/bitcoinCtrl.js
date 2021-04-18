import { bip32, networks, payments } from 'bitcoinjs-lib';
import conf from '../config/config';
import * as _ from 'lodash';
import dbCtrl from "./dbCtrl";
import U from '../utils/helper';
import telegramBot from '../utils/telegram';
import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";


class BitcoinCtrl {
    constructor() {
        this.onTxDepositedHandler = () => {};
        this.onPendingDepositHandler = () => {};
        this.isMainNet = conf.env === 'prod';
        this.pubKeys = conf.walletSigs.pubKeys;
        this.cosigners = conf.walletSigs.cosigners;
        this.thresholdConfirmations = conf.thresholdConfirmations;
        this.api = new BitcoinNodeWrapper(conf.node);
        this.network = this.isMainNet ? networks.bitcoin : networks.testnet;
    }

    getDerivedPubKeys(index) {
        let publicKeys = this.pubKeys.map(key => {
            const node = bip32.fromBase58(key, this.network);
            const child = node.derive(0).derive(index);
            return child.publicKey.toString('hex');
        });
        publicKeys.sort();
        publicKeys = publicKeys.map(k => Buffer.from(k, 'hex'));
        return publicKeys;
    }

    async createAddress(index, label) {
        console.log("create payment address key for "+index+" "+label);
        const publicKeys = this.getDerivedPubKeys(index);

        const payment = payments.p2sh({
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

        const payment = payments.p2sh({
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

    async addPendingDepositTx({ address, value, txId, label }) {
        try {
            const user = await dbCtrl.getUserByBtcAddress(address);
            const added = await dbCtrl.getDeposit(txId, label);

            if (added == null && user != null) {
                const msg = `user ${user.btcadr} (label ${label}) has a pending deposit, tx ${txId}, value ${(value / 1e8)} BTC`
                telegramBot.sendMessage(msg);

                await dbCtrl.addDeposit(user.label, txId, value, false);

                this.onPendingDepositHandler(user.label, {
                    txHash: txId,
                    value: value,
                    status: 'pending'
                });
            }

        } catch (e) {
            console.error(e);
        }
    }

    async depositTxConfirmed({ address, value, txId, confirmations, label }) {
        try {
            const user = await dbCtrl.getUserByBtcAddress(address);
            const confirmedInDB = await dbCtrl.getDeposit(txId, label);

            if (user != null && (confirmedInDB == null || confirmedInDB.status !== 'confirmed')) {
                this.onTxDepositedHandler({
                    address: user.btcadr,
                    label: user.label,
                    txHash: txId,
                    conf: confirmations,
                    val: value
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

        console.log("checking deposits - %d confirmation depth by default",
            conf.maxConfirmationsToTrack);
        const since = await this.api.listDepositsSinceBlock(
            blockBookmark,
            conf.maxConfirmationsToTrack,
        );

        const txList = (since.transactions || []).filter(tx => {
            if (! addrLabels.has(tx.label)) {
                console.log("ignoring unknown label %s", tx.label);
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

        console.log(
            "%d btc deposits in the window - %d confirmed, %d unconfirmed",
            summary.total, summary.confirmed, summary.unconfirmed
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
                });
            } else if (confirmations >= this.thresholdConfirmations) {
                await this.depositTxConfirmed({
                    address: tx.address,
                    value: tx.value,
                    txId: tx.txId,
                    confirmations: confirmations,
                    label: tx.label,
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
}

export default new BitcoinCtrl();
