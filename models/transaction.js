import BaseModel from './baseModel';

export default class Transaction extends BaseModel {
    constructor(db) {
        const sql = `CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userAdrLabel text,
            txHash text UNIQUE,
            txId INTEGER UNIQUE,
            valueBtc INTEGER,
            dateAdded datetime,
            status text,
            type text 
        )`;

        super(db, 'transactions', sql);
    }

    async createTable() {
        try {
            const userTb = await super.createTable();

            console.log("Created Transaction table", userTb);

            return userTb;
        } catch (e) {
            console.log('Can not create Transaction table', e);
        }
    }

    insertDepositTx({userAdrLabel, txHash, valueBtc, status}) {
        return super.insert({
            userAdrLabel, txHash, valueBtc,
            type: "deposit",
            dateAdded: new Date(),
            status: status
        });
    }

    insertTransferTx({userAdrLabel, txHash, txId, valueBtc, status}) {
        return super.insert({
            userAdrLabel, txHash, txId, valueBtc, 
            type: "transfer",
            dateAdded: new Date(),
            status: status
        });
    }

    getUserBtcAdrByTxId({ txId }) {
        return super.findOne({ txId })
    }

    async sumDeposited() {
        try {
            const res = await this.get(`SELECT type, SUM(valueBtc) total FROM ${this.table} WHERE type = 'deposit' GROUP BY type`);
            return res && res.total || 0;
        } catch (e) {
            console.error(e);
            return 0;
        }
    }
}
