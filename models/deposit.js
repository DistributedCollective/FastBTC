import Transaction from './transaction';

export default class DepositTransaction extends Transaction {
    constructor(db) {
        const sql = `CREATE TABLE IF NOT EXISTS deposits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transferId INTEGER UNIQUE,
            userAdrLabel text,
            txHash text UNIQUE,
            valueBtc INTEGER,
            dateAdded datetime,
            status text,
            FOREIGN KEY (transferId) REFERENCES transactions(id)
        )`;

        super(db, 'deposits', sql);
    }

    insertDepositTx({userAdrLabel, txHash, valueBtc, status}) {
        return super.insert({
            userAdrLabel, txHash, valueBtc,
            type: "deposit",
            dateAdded: new Date(),
            status: status
        });
    }

    async sumDeposited() {
        try {
            const res = await this.get(`SELECT type, SUM(valueBtc) total FROM ${this.table} WHERE type = 'transfer' GROUP BY type`);
            return res && res.total || 0;
        } catch (e) {
            console.error(e);
            return 0;
        }
    }
}
