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

    insertTransferTx({userAdrLabel, txHash, valueBtc, status}) {
        return super.insert({
            userAdrLabel, txHash, valueBtc,
            type: "transfer",
            dateAdded: new Date(),
            status: status
        });
    }

    async getTransactionByTxId(txId) {
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
    async sumTransacted(type) {
        try {
            const res = await this.get(`SELECT type, SUM(valueBtc) total FROM ${this.tableName} WHERE type = ? AND status = 'confirmed' GROUP BY type`, [type]);
            return res && res.total || 0;
        } catch (e) {
            console.error(e);
            return 0;
        }
    }

    async countConfirmed(type) {
        try {
            const res = await this.get(`SELECT type, COUNT(*) FROM ${this.tableName} WHERE type = ? AND status = 'confirmed' GROUP BY type`, [type]);
            return res || 0;
        } catch (e) {
            console.error(e);
            return 0;
        }
    }
}
