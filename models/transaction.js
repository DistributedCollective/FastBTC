import BaseModel from './baseModel';

export default class Transaction extends BaseModel {
    constructor(db) {
        const sql = `CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userAdrLabel text,
            txHash text UNIQUE,
            valueBtc INTEGER,
            valueUsd INTEGER,
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

    insertDepositTx({userAdrLabel, txHash, valueBtc, valueUsd, status}) {
        return super.insert({
            userAdrLabel, txHash, valueBtc, valueUsd,
            type: "deposit",
            dateAdded: new Date(),
            status: status
        });
    }

    insertTransferTx({userAdrLabel, txHash, valueBtc, valueUsd, status}) {
        return super.insert({
            userAdrLabel, txHash, valueBtc, valueUsd,
            type: "transfer",
            dateAdded: new Date(),
            status: status
        });
    }
}
