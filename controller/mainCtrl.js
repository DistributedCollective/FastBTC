/**
 * Main controller.
 * Starts all other controllers and handles client communication.
 * Processes btc deposits, takes the client rsk address and sends corresponding btc address, informs the client about the relay process status and sends deposit/error notifications to a telegram group
 */
const SocketIO = require('socket.io');
import conf from '../config/config';
import dbCtrl from './dbCtrl';
import rskCtrl from './rskCtrl';
import Util from '../utils/helper';
import telegramBot from '../utils/telegram';
import bitcoinCtrl from "./bitcoinCtrl";

class MainController {

    async start(server) {
        this.connectingSockets = {}; //object of {[label]: socketId}

        await dbCtrl.initDb(conf.dbName);
        await rskCtrl.init();
        this.initSocket(server);
        bitcoinCtrl.checkDepositTxs().catch(console.error);

        bitcoinCtrl.setPendingDepositHandler(this.onPendingDeposit.bind(this));
        bitcoinCtrl.setTxDepositedHandler(this.processDeposits.bind(this));
    }

    initSocket(httpServer) {
        console.log("init socket")
        this.io = SocketIO(httpServer, {
            allowEIO3: true, // false by default
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
              }
        });

        this.io.on('connection', socket => {
            socket.on('getDepositAddress', (...args) => this.getDepositAddress.apply(this, [socket, ...args]));
            socket.on('getDepositHistory', (...args) => this.getDepositHistory.apply(this, [...args]));
            socket.on('getStats', (...args) => this.getStats.apply(this, [...args]));
            socket.on('getDays', (...args) => this.getDays.apply(this, [...args]));
            socket.on('txAmount', (...args) => this.sendTxMinMax.apply(this, [...args]));
            socket.on('getDeposits', (...args) => this.getDbDeposits.apply(this, [...args]));
            socket.on('getTransfers', (...args) => this.getTransfers.apply(this, [...args]));
        });
    }

    /**
     * Loads a users btc address or creates a new user entry in the database
     */
    async getDepositAddress(socket, address, cb) {
        try {
            if (! address) {
                return cb({error: "Address is empty"});
            }

            let user = await dbCtrl.getUserByAddress(address);

            if (user == null) {
                try {
                    user = await this.addNewUser(address);
                }
                catch (e) {
                    console.log('failed to add user for address %s: %s', address, e)
                    return cb({ error: "Cannot add the user to the database. Try again later." });
                }
            }

            this.connectingSockets[user.label] = socket.id;

            if (user.btcadr) {
                await bitcoinCtrl.checkAddress(user.id, user.label, new Date(user.dateAdded));
            } else {
                const btcAdr = await bitcoinCtrl.createAddress(user.id, user.label);
                if (btcAdr) {
                    await dbCtrl.userRepository.update({ id: user.id }, { btcadr: btcAdr });
                    user = await dbCtrl.getUserByAddress(address);
                } else {
                    console.error("Error creating btc deposit address for user " + address);
                    return cb({ error: "Can not get new BTC deposit address" });
                }
            }

            console.log("returning user");
            console.log(user);
            return cb(null, user);

        } catch (e) {
            console.error(e);
            cb({ error: "Server error. Please contact the admin community@sovryn.app" });
        }
    }


    /**
     * Loads all deposits from user
     */
    async getDepositHistory(address, cb) {
        if (address == null || address === '') {
            return cb({ error: "Address is empty" });
        }

        const hist = await dbCtrl.getDepositHistory(address);
        if (hist && hist.length > 0) {
            cb(hist);
        }
        else {
            cb([]);
        }
    }

    /**
     * create a DB entry for a new user
     * @param {*} address the user's RSK address
     */
    async addNewUser(address) {
        const newLabel = await Util.getRandomString(16);
        return await dbCtrl.addUser(address, '', newLabel);
    }

    /**
     * Get min/max amount for deposits
     * @param cb - callback function
     * @returns {Promise<void>}
     */
    async sendTxMinMax(cb) {
        cb({
            max: Number((conf.maxAmount / 1e8).toFixed(8)),
            min: Number((conf.minAmount / 1e8).toFixed(8))
        });
    }


    /**
     * Loads stats for both transfers and deposits
     */
    async getStats(cb) {
        try {
            let deposits = {}; let transfers = {};

            deposits.totalTransacted = await dbCtrl.getSum('deposit');
            deposits.totalNumber = await dbCtrl.getTotalNumberOfTransactions('deposit');
            transfers.totalTransacted = await dbCtrl.getSum('transfer');
            transfers.totalNumber = await dbCtrl.getTotalNumberOfTransactions('transfer');

            deposits.averageSize = (deposits.totalTransacted / deposits.totalNumber).toFixed(6);
            transfers.averageSize = (transfers.totalTransacted / transfers.totalNumber).toFixed(6);

            cb({deposits, transfers});
        } catch (e) {
            console.log(e);
        }
    }

    async getDays(cb) {
        try {
            let days = [];
            const currentDate = new Date();
            for (let d=0; d<=50; d++) {
                const date = currentDate - d;
                const deposits = await dbCtrl.getTotalNumberOfTransactions('deposit', date);
                const depositsTotalAmount = await dbCtrl.getSum('deposits', date);
                const transfers = await dbCtrl.getTotalNumberOfTransactions('transfer', date);
                const transfersTotalAmount = await dbCtrl.getSum('transfer', date);
                days.push({
                    date,
                    deposits,
                    depositsTotalAmount,
                    transfers,
                    transfersTotalAmount
                })
            }
            cb({days});
        } catch (e) {
            console.log(e);
        }
    }

    async getDbDeposits(cb) {
        try {
            const list = await dbCtrl.getAllDeposits();
            cb(list || []);
        } catch (e) {
            console.error(e);
        }
    }

    async getTotalDeposits(cb) {
        try {
            const total = await dbCtrl.getSum('deposit');
            cb(total);
        } catch (e) {
            console.error(e);
            cb({ error: "Something's wrong" })
        }
    }

    async getTransfers(cb) {
        try {
            const list = await dbCtrl.getAllTransfers();
            cb(list || []);
        } catch (e) {
            console.error(e);
        }
    }

    async processDeposits(d) {
        const depositFound = await dbCtrl.getDeposit(d.txHash, d.label);

        if (depositFound) {
            if (depositFound.status === 'confirmed') {
                return;
            }

            await dbCtrl.confirmDeposit(d.txHash, d.label);
        }

        telegramBot.sendMessage("New BTC deposit arrived: " + JSON.stringify(d));
        if (d.val > conf.maxAmount || d.val <= 10000) {
            telegramBot.sendMessage("Deposit outside the limit!");
        }

        if (depositFound == null) {
            const resDb = await dbCtrl.addDeposit(d.label, d.txHash, d.val, true);

            if (!resDb) {
                return console.error("Error adding deposit to db");
            }
        }

        const user = await dbCtrl.getUserByLabel(d.label);
        if (!user) {
            return console.error("Error finding user");
        }

        this.emitToUserSocket(user.label, 'depositTx', {
            txHash: d.txHash,
            value: (d.val / 1e8).toFixed(6),
            status: 'confirmed'
        });

        console.log("about to send R-BTC")
        const resTx = await rskCtrl.sendRbtc(d.val, user.web3adr);
        if (resTx.error) {
            console.error("Error transfering funds to " + user.web3adr);
            console.error(resTx.error);

            this.emitToUserSocket(user.label, "depositError", resTx.error);
            return;
        }

        await dbCtrl.updateDeposit(d.txHash, resTx.txId, d.label);
        await dbCtrl.addTransferTx(d.label, resTx.txHash, d.val);

        console.log("Successfully sent " + d.val + " to " + user.web3adr);
        console.log(resTx);

        this.emitToUserSocket(user.label, "transferTx", {
            txHash: resTx.txHash,
            value: Number(resTx.value).toFixed(6)
        });
        const msg = Number(resTx.value).toFixed(6) + " Rsk withdrawal initiated for " + user.web3adr;
        if (telegramBot) {
            telegramBot.sendMessage(`${msg} ${conf.blockExplorer}/tx/${resTx.txHash}`);
        }
    }

    emitToUserSocket(userLabel, event, data) {
        if (userLabel && this.connectingSockets[userLabel]) {
            const socketId = this.connectingSockets[userLabel];
            console.log("sending message to client", socketId, event, data);
            this.io.to(socketId).emit(event, data, userLabel);
        }
    }

    onPendingDeposit(userLabel, tx) {
        this.emitToUserSocket(userLabel, 'depositTx', {
            status: 'pending',
            txHash: tx.txHash,
            value: (Number(tx.value) / 1e8).toFixed(6)
        });
    }
}

export default new MainController();
