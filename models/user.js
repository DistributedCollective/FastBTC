import BaseModel from './baseModel';

export default class User extends BaseModel {
    constructor(db) {
        super(db, 'user', `CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            web3adr text,
            btcadr text,
            label text UNIQUE ,
            dateAdded datetime
            )`);
    }


    async createTable() {
        try {
            const userTb = await super.createTable();

            console.log("Created User table", userTb);

            return userTb;
        } catch (e) {
            console.log('Can not create User table', e);
        }
    }

    insert({web3adr, btcadr, label}) {
        return super.insert({
            web3adr,
            btcadr,
            label,
            dateAdded: new Date()
        })
    }

    /**
     *
     * @param { {id, web3adr, btcadr, label} } criteria
     * @returns {*}
     */
    findOne(criteria) {
        return super.findOne(criteria);
    }

    /**
     *
     * @param { {id, web3adr, btcadr, label} } criteria
     * @param { {offset, limit, orderBy} } options
     * @returns {*}
     */
    find(criteria, options = {}) {
        return super.find(criteria, options);
    }
}
