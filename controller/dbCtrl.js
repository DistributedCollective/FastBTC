/**
 * Database controller
 * Stores user deposits on a given Btc address and corresponding Rsk transfers
 * 
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

import {User, Transaction} from '../models/index';

class DbCtrl {

    async initDb(dbName) {
        return new Promise(resolve => {
            const file = path.join(__dirname, '../db/' + dbName + ".db");
            this.db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    console.error(err.message, file);
                } else {
                    console.log('Connected to the ' + dbName + ' database.');
                    this.initRepos().catch(console.log).then(() => resolve());
                }
            });
        });
    }

    /**
     * @private
     */
    async initRepos() {
        try {
            this.userRepository = new User(this.db);
            this.transactionRepository = new Transaction(this.db);

            await this.userRepository.createTable();
            await this.transactionRepository.createTable();
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Helpers
     **/

    async getUserByAddress(adr) {
        try {
            const user = await this.userRepository.findByAddress(adr);


            if (user) {
                console.log("user found");
                console.log(user);
            }
            else {
                console.log("no user found");
            }

            return user;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async getUserByLabel(label) {
        try {
            return await this.userRepository.findOne({
                label: label
            });
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async addUser(web3adr, btcadr, label) {
        try {
            return await this.userRepository.insert({
                web3adr,
                btcadr,
                label
            });
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async getUserByLabel(label) {
        try {
            return await this.userRepository.findOne({
                label: label
            });
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async getUserByBtcAddress(adr) {
        try {
            return await this.userRepository.findOne({
                btcadr: adr
            });
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async addUser(web3adr, btcadr, label, email) {
        try {
            return await this.userRepository.insert({
                web3adr,
                btcadr,
                label,
                email,
            });
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async updateUser(userId, {name, email}) {
        try {
            await this.userRepository.update({id: userId}, {name: name, email: email});

            return await this.userRepository.findOne({id: userId});
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async getNextUserId() {
        try {
            const users = await this.userRepository.find({}, {
                limit: 1,
                orderBy: {id: -1}
            });

            return users && users[0] && (users[0].id + 1) || 0;
        } catch (e) {
            console.log(e);
            return Promise.reject(e);
        }
    }


    async findUsersByAdrList(addresses) {
        try {
            const users = await this.userRepository.find({
                btcadr: addresses
            });

            return users || [];
        } catch (e) {
            console.log(e);
            return Promise.reject(e);
        }
    }

    async addDeposit(userAdrLabel, txHash, valueBtc, isConfirmed = false) {
        try {
            return await this.transactionRepository.insertDepositTx({
                userAdrLabel,
                txHash,
                valueBtc,
                status: isConfirmed ? 'confirmed' : 'pending'
            });
        } catch (e) {
            console.log(e);
            return null;
        }
    }
    
    async getDeposit(txHash, label = '') {
        try {
            const criteria = {
                txHash: txHash,
                type: "deposit"
            };
            if (label) criteria['userAdrLabel'] = label;

            return await this.transactionRepository.findOne(criteria);
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async getDepositByTxId(txHash, label = '') {
        try {
            const criteria = {
                txHash: txHash,
                type: "deposit"
            };
            if (label) criteria['userAdrLabel'] = label;

            return await this.transactionRepository.findOne(criteria);
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    getDepositHistory(userWeb3Adr) {
        const sql = "select user.id, web3adr, btcadr, valueBtc, type, transactions.dateAdded, transactions.txHash, status"
        + " from user cross join transactions on user.label = transactions.userAdrLabel "
        +"AND web3adr = '"+userWeb3Adr+"';";
       
        return new Promise(resolve=> {
            try {
                this.db.all(sql, [], (err, rows) => {
                    if (err) {
                        console.log('Error running sql: ' + sql);
                        console.log(err);
                        return resolve(null);
                    }
                    else {
                        //console.log(rows);
                        for(let i in rows) rows[i].dateAdded = new Date(rows[i].dateAdded);
                        return resolve(rows);
                    }
                });
            }
            catch(e){
                console.log('Error executing sql: ' + sql);
                console.log(err);
                return resolve(null);
            }
        });
    }

    getLastTxTimestamp(){
        const sql = "select dateAdded from transactions where type = 'deposit' order by dateAdded desc;";
       
        return new Promise(resolve=> {
            try {
                this.db.get(sql, [], (err, result) => {
                    if (err) {
                        console.log('Error running sql: ' + sql);
                        console.log(err);
                        return resolve(Date.now());
                    }
                    else {
                        if(result && result.dateAdded) return resolve(result.dateAdded);
                        else {
                            console.log("No deposit found. Create new timestamp now()");
                            return resolve(Date.now());
                        }
                    }
                });
            }
            catch(e){
                console.log('Error executing sql: ' + sql);
                console.log(err);
                return resolve(Date.now());
            }
        });
    }
    
    async confirmDeposit(txHash) {
        try {
            return await this.transactionRepository.update({
                txHash: txHash,
                type: "deposit"
            }, {status: 'confirmed'});
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async addTransferTx(userAdrLabel, txHash, txId, valueBtc) {
        try {
            return await this.transactionRepository.insertTransferTx({
                userAdrLabel,
                txHash,
                txId,
                valueBtc,
                status: 'confirmed'
            });
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async getUserBtcAdrAndTxHashByTxId(txId) {
        try {
            const tx = await this.transactionRepository.getTransactionByTxId({ txId });
            const user = await this.getUserByLabel({ label: tx.userAdrLabel });
            return { btcAdr: user.btcadr, txHash: tx.txHash};
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async getUserLabels(skip = 0, size = 10) {
        try {
            const users = await this.userRepository.find({}, {offset: skip, limit: size});

            return (users || []).map(u => u.label);
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    /**
     *
     * @param { string[] } txHashList
     * @returns {Promise<unknown>}
     */
    async findTx(txHashList) {
        return await this.transactionRepository.find({
            txHash: txHashList
        });
    }

    async getAllDeposits() {
        return this.transactionRepository.find({
            type: 'deposit'
        })
    }

    async getAllTransfers() {
        return this.transactionRepository.find({
            type: 'transfer'
        })
    }

    async getSumDeposited() {
        return await this.transactionRepository.sumDeposited();
    }

}

export default new DbCtrl();