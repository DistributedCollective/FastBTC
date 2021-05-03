import * as bitcoin from 'bitcoinjs-lib';
const assert = require('assert');
import bitcoinCtrl from "../controller/bitcoinCtrl";
import dbCtrl from "../controller/dbCtrl";
import config from "../config/config";

describe("BitcoinCtrl", async () => {
    before(async () => {
        dbCtrl.initDb(config.dbName);
    })

    it("should create a new address", async () => {
        const address = await bitcoinCtrl.createAddress(0);

        assert(address && bitcoin.address.fromBech32(address).data != null);
    });
/*
    it('should return wallet deposits for given address', async () => {
        const tx = await bitcoinCtrl.api.getAddressDetail([""], null);
        console.log("--------")
        console.log(tx);
        const detail = tx && tx[0];

        assert(detail && detail.transfers && detail.transfers.length >0);
    });
/*
    it("should return all deposits in block number for users in db", async () => {
       const tx = await bitcoinCtrl.getTxOnBlock(1891472);
       console.log(tx);

       assert(tx && tx[0] && tx[0].address === "");
    });*/
});