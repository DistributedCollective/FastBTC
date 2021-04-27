import BaseModel from './baseModel';

export default class User extends BaseModel {
    constructor(db) {
        super(db, 'user');
    }

    insert({web3adr, btcadr, label}) {
        return super.insert({
            web3adr: web3adr.toLowerCase(),
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

    findByAddress(address) {
        return super.get(
            // the descending ordering will give the latest one first...
            `SELECT * FROM ${this.tableName} WHERE web3adr = ? ORDER BY id DESC`,
            [address.toString().toLowerCase()]
        );
    }
}
