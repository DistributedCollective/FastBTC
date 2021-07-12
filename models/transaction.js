import BaseModel from './baseModel';

export default class Transaction extends BaseModel {
    constructor(db) {
        super(db, 'transactions');
    }

    insertDepositTx({userAdrLabel, txHash, valueBtc, status, vout}) {
        return super.insert({
            userAdrLabel, txHash, valueBtc,
            type: "deposit",
            dateAdded: new Date(),
            status: status,
            vout: vout,
        });
    }

    insertTransferTx({userAdrLabel, txHash, valueBtc, txId, status}) {
        return super.insert({
            userAdrLabel, txHash, valueBtc,
            type: "transfer",
            dateAdded: new Date(),
            txId,
            status: status
        });
    }

    async getDepositByTxId(txId) {
        try {
            const res = await super.get("SELECT * from transactions WHERE type = 'deposit' and txId = ?", [txId]);
            console.log(res);
            return res;
        } catch (e) {
            console.error(e);
            return null;
        }
    }
    // type should be either 'deposit' or 'tranfer'
    async sumTransacted(type, date) {
        try {
            const sql = date ? `SELECT type, SUM(valueBtc) total FROM ${this.tableName} WHERE type = ? AND status = 'confirmed' AND 
                (julianday(date(datetime(${date}/1000, 'unixepoch'))) - julianday(date(datetime(dateAdded/1000, 'unixepoch')))) = 0.0 GROUP BY type` :
                `SELECT type, SUM(valueBtc) total FROM ${this.tableName} WHERE type = ? AND status = 'confirmed' GROUP BY type`;
            const res = await this.get(sql, [type]);
            return res && res.total || 0;
        } catch (e) {
            console.error(e);
            return 0;
        }
    }

    async countConfirmed(type, date) {
        try {
            const res = await this.get(`SELECT type, COUNT(*) FROM ${this.tableName} WHERE type = ? AND status = 'confirmed' GROUP BY type`, [type]);
            return res ? res['COUNT(*)'] : 0;

        } catch (e) {
            console.error(e);
            return 0;
        }
    }

    async countUnprocessed(type) {
        try { 
            const res = await this.get(`SELECT type, COUNT(*) AS ct FROM ${this.tableName} WHERE type = ? AND txId = NULL AND id > 100 AND status = 'confirmed' GROUP BY type`, [type]);
            return res ? res.ct : 0;
        } catch(e) {
            console.error(e);
            return 0;
        }
    }
}
