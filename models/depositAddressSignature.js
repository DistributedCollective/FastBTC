import BaseModel from "./baseModel";

export default class DepositAddressSignature extends BaseModel {
    constructor(db) {
        super(db, 'deposit_address_signature');
    }
}
