import BaseModel from './baseModel';

export default class Transaction extends BaseModel {
    constructor(db, tableName, createTableSQL) {
        super(db, tableName, createTableSQL);
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

    async getTransactionByTxId(txId) {
        try {
            const res = await super.get("SELECT * from transactions WHERE type like 'deposit' and txId = "+txId);
            console.log(res);
            return res;
        } catch (e) {
            console.error(e);
            return null;
        }
    }
}
