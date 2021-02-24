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

    constructor(){
        // a cosigner is the slave node watching for withdraw requests that need confirmation
        this.cosignersArray = []
    }

    async start(server) {
        this.connectingSockets = {}; //object of {[label]: socketId}

        this.initSocket(server);
        await dbCtrl.initDb(conf.dbName);
        await bitcoinCtrl.init();
        await rskCtrl.init();
        
        bitcoinCtrl.setPendingDepositHandler(this.onPendingDeposit.bind(this));
        bitcoinCtrl.setTxDepositedHandler(this.processDeposits.bind(this));
    }

    initSocket(app) {
        this.io = SocketIO(app);

        this.io.on('connection', socket => {
            console.log(new Date(Date.now())+", A cosigner connected", socket.id);
            socket.on('getCosignerIndexAndDelay', (data, cb) => this.addCosigner(socket, cb));
            socket.on('disconnect', () => this.removeCosigner(socket));
            socket.on('getDepositAddress', (...args) => this.getDepositAddress.apply(this, [socket, ...args]));
            socket.on('getDepositHistory', (...args) => this.getDepositHistory.apply(this, [...args]));
            socket.on('txAmount', (...args) => this.getTxAmount.apply(this, [...args]));
            socket.on('getDeposits', (...args) => this.getDbDeposits.apply(this, [...args]));
            socket.on('getTransfers', (...args) => this.getTransfers.apply(this, [...args]));
        });
    }

    addCosigner(socket, cb){
        console.log("Adding cosigner");
        this.cosignersArray.push(socket.id);
        return cb({index: this.cosignersArray.length-1, delay: 2 * (this.cosignersArray.length-1)});
    }

    removeCosigner(socket){
        console.log("Removing cosigner");
        this.cosignersArray = this.cosignersArray.filter(index => index !== socket.id);
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


            let user = await dbCtrl.getUserByAddress(address);
            
            if (user == null) user = await this.addNewUser(address);
            
            if (user != null) {
                this.connectingSockets[user.label] = socket.id;      
            } else {
                return cb({error: "Cannot add the user to the database. Try again later."});
            }

            if(user.btcadr != null && user.btcadr != ''){
                await bitcoinCtrl.checkAddress(user.id, user.label, new Date(user.dateAdded)); 
            } else {
                const btcAdr = await bitcoinCtrl.createAddress(user.id, user.label);
                if (btcAdr) {
                    await dbCtrl.userRepository.update({id: user.id}, {btcadr: btcAdr});
                    user = await dbCtrl.getUserByAddress(address);
                } else {
                    console.error("Error creating btc deposit address for user " + address);
                    return cb({error: "Can not get new BTC deposit address"});
                }
            }
            
            console.log("returning user");
            console.log(user);
            return cb(null, user);

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
     * create a DB entry for a new user
     * @param {*} address the user's RSK address
     */
    async addNewUser(address) {
        try {
            const newLabel = await Util.getRandomString(16);
            return await dbCtrl.addUser(address, '', newLabel);
        } catch (e) {
            return Promise.reject(e);
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
            cb({
                max: Number((conf.maxAmount / 1e8).toFixed(8)),
                min: Number((conf.minAmount / 1e8).toFixed(8))
            });
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
          const total = await dbCtrl.getSumDeposited();
          cb(total);
        } catch (e) {
          console.error(e);
          cb({error: "Something's wrong"})
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
        const depositFound = await dbCtrl.getDeposit(d.txHash);

        if (depositFound) {
            if (depositFound.status === 'confirmed') return;

            await dbCtrl.confirmDeposit(d.txHash);
        }

        telegramBot.sendMessage("New BTC deposit arrived: " + JSON.stringify(d));

        if (depositFound == null) {
            const resDb = await dbCtrl.addDeposit(d.label, d.txHash, d.val, true);

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

        await dbCtrl.addTransferTx(d.label, resTx.txHash, resTx.txId, d.val);

        console.log("Successfully sent " + d.val + " to " + user.web3adr);
        console.log(resTx);

        this.emitToUserSocket(user.label, "transferTx", {
            txHash: resTx.txHash,
            value: Number(resTx.value).toFixed(6)
        });
        telegramBot.sendMessage(Number(resTx.value).toFixed(6)+" Rsk transferred to " + user.web3adr);
    }

    emitToUserSocket(userLabel, event, data) {
        if (userLabel && this.connectingSockets[userLabel]) {
            const socketId = this.connectingSockets[userLabel];
            console.log(new Date(Date.now())+", sending message to client", socketId, event, data);
            this.io.to(socketId).emit(event, data, userLabel);
        }
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