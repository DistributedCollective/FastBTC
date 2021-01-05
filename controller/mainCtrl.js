/**
 * Main controller.
 * Starts all other controllers and handles client communication.
 * Processes btc deposits, takes the client rsk address and sends corresponding btc address, informs the client about the relay process status and sends deposit/error notifications to a telegram group
 */


const TelegramBot = require('telegraf/telegram');
const SocketIO = require('socket.io');
import conf from '../config/config';
import Web3 from 'web3';
import dbCtrl from './dbCtrl';
import rskCtrl from './rskCtrl';
import Util from '../utils/helper';
import bitcoinCtrl from "./bitcoinCtrl";

class MainController {

    async start(server) {
        this.infoBot = new TelegramBot(conf.infoBot);
        this.errorBot = new TelegramBot(conf.errorBot);
        this.web3 = new Web3(conf.rskNode);
        this.connectingSockets = {}; //object of {[label]: socketId}

        this.initSocket(server);
        await dbCtrl.initDb(conf.dbName);
        await bitcoinCtrl.init();
        await rskCtrl.init();
        
        this.getDeposits();
        this._pollBTCPrice();

        bitcoinCtrl.onPendingDeposit(this.onPendingDeposit.bind(this));
    }

    initSocket(app) {
        this.io = SocketIO(app);

        this.io.on('connection', socket => {
            console.log(new Date(Date.now())+", A user connected", socket.id);
            socket.on('getDepositAddress', (...args) => this.getDepositAddress.apply(this, [socket, ...args]));
            socket.on('getDepositHistory', (...args) => this.getDepositHistory.apply(this, [...args]));
            socket.on('txAmount', (...args) => this.getTxAmount.apply(this, [...args]));
            socket.on('getDeposits', (...args) => this.getDbDeposits.apply(this, [...args]));
        });
    }

    _pollBTCPrice() {
        const p = this;

        setInterval(async () => {
            try {
                const price = await Util.getBTCPrice();

                if (price != null) {
                    for (let userLabel of Object.keys(p.connectingSockets)) {
                        p.emitToUserSocket(userLabel, 'txAmount', {
                            max: Number((conf.maxAmountInUsd / price).toFixed(8)),
                            min: Number((conf.minAmount / 1e8).toFixed(8))
                        });
                    }
                }
            } catch (e) {
                console.error("error getting btc price")
                console.error(e);
            }

        }, conf.pricePollingTime);
    }

    /**
     * Loads a users btc address or creates a new user entry in the database
     */
    async getDepositAddress(socket, address, cb) {
        try {
            console.log("User get deposit address", address);

            if (address == null || address === '') {
                return cb({error: "Address is empty"});
            }

            const user = await dbCtrl.getUserByAddress(address);

            if (user != null) {
                this.connectingSockets[user.label] = socket.id;
                await bitcoinCtrl.checkAddress(user.id, new Date(user.dateAdded));
                return cb(null, user);
            }

            const newLabel = await Util.getRandomString(16);
            const nextUserIndex = await dbCtrl.getNextUserId();
            const btcAdr = await bitcoinCtrl.createAddress(nextUserIndex);

            if (btcAdr) {
                const newUser = await dbCtrl.addUser(address, btcAdr, newLabel);
                this.connectingSockets[newUser.label] = socket.id;

                cb(null, newUser);
            } else {
                console.error("Error creating btc deposit address for user " + address);
                cb({error: "Can not get new BTC deposit address"});
            }

        } catch (e) {
            console.error(e);
            cb({error: "Server error. Please contact the admin community@sovryn.app"});
        }
    }

    /**
     * Loads all deposits from user
     */
    async getDepositHistory(address, cb) {
        console.log("User get deposit history", address);

        if (address == null || address === '') {
            return cb({error: "Address is empty"});
        }

        const hist = await dbCtrl.getDepositHistory(address);
        if(hist && hist.length>0) {
            cb(hist);
        }
        else{
            cb([]);
        }
    }



    /**
     * Get max/min amount for deposit to user address
     * @param socket - client socket
     * @param cb - callback function
     * @returns {Promise<void>}
     */
    async getTxAmount(cb) {
        try {
            const price = await Util.getBTCPrice();

            if (price != null) {
                cb({
                    max: Number((conf.maxAmountInUsd / price).toFixed(8)),
                    min: Number((conf.minAmount / 1e8).toFixed(8))
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Callback is called in a small intervall. It returns a list of last incoming btc deposits.
     * After checking if the transaction is not yet added in the datase it sends the corresponding amount to the rsk address.
     */
    async getDeposits() {
        const p = this;
        bitcoinCtrl.getAllTxWrapper(async res => {
            console.log("Processing "+res.length+ " deposits");
            for (let d of res) await p.processDeposits(d);
        });
    }

    async getDbDeposits(cb) {
        try {
            const list = await dbCtrl.getAllDeposits();
            cb(list || []);
        } catch (e) {
            console.error(e);
        }
    }


    async processDeposits(d) {
        const depositFound = await dbCtrl.getDeposit(d.txHash);

        if (depositFound) {
            if (depositFound.status === 'confirmed') return;

            await dbCtrl.confirmDeposit(d.txHash);
        }

        console.log("New Btc deposit arrived");
        console.log(d);
        this.sendInfoNotification("New Btc deposit arrived. " + JSON.stringify(d));

        if (depositFound == null) {
            const resDb = await dbCtrl.addDeposit(d.label, d.txHash, d.val, d.usd, true);

            if (!resDb) return console.error("Error adding deposit to db");
        }

        const user = await dbCtrl.getUserByLabel(d.label);
        if (!user) return console.error("Error finding user");

        this.emitToUserSocket(user.label, 'depositTx', {
            txHash: d.txHash,
            value: (d.val / 1e8).toFixed(6),
            status: 'confirmed'
        });

        const resTx = await rskCtrl.sendRbtc(d.val, user.web3adr);
        if (resTx.error) {
            console.error("Error transfering funds to " + user.web3adr);
            console.error(resTx.error);

            this.emitToUserSocket(user.label, "depositError", resTx.error);
            return;
        }

        await dbCtrl.addTransferTx(d.label, resTx.txHash, d.val, d.usd);

        console.log("Successfully sent " + d.val + " to " + user.web3adr);
        console.log(resTx);

        this.emitToUserSocket(user.label, "transferTx", {
            txHash: resTx.txHash,
            value: Number(resTx.value).toFixed(6)
        });
        this.sendInfoNotification(Number(resTx.value).toFixed(6)+" Rsk transferred to " + user.web3adr);
    }

    emitToUserSocket(userLabel, event, data) {
        if (userLabel && this.connectingSockets[userLabel]) {
            const socketId = this.connectingSockets[userLabel];
            console.log(new Date(Date.now())+", sending message to client", socketId, event, data);
            this.io.to(socketId).emit(event, data, userLabel);
        }
    }

    sendInfoNotification(msg) {
        if (conf.sendTelegramNotifications) this.infoBot.sendMessage(conf.telegramGroupId, msg);
    }

    sendErrorNotification(msg) {
        if (conf.sendTelegramNotifications) this.errorBot.sendMessage(conf.telegramGroupId, msg);
    }

    onPendingDeposit(userLabel, tx) {
        this.emitToUserSocket(userLabel, 'depositTx', {
            status: 'pending',
            txHash: tx.txHash,
            value: (Number(tx.value)/1e8).toFixed(6)
        });
    }
}

export default MainController;
