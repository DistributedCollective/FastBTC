import Transaction from './transaction';

export default class TrasnferTransaction extends Transaction {
    constructor(db) {
        const sql = `CREATE TABLE IF NOT EXISTS transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userAdrLabel text,
            txHash text UNIQUE,
            txId INTEGER UNIQUE,
            valueBtc INTEGER,
            dateAdded datetime,
            status text
        )`;

        super(db, 'transfers', sql);
    }

    insertTransferTx({userAdrLabel, txHash, txId, valueBtc, status}) {
        return super.insert({
            userAdrLabel, txHash, txId, valueBtc, 
            type: "transfer",
            dateAdded: new Date(),
            status: status
        });
    }
}
