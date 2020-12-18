import * as bitcoin from 'bitcoinjs-lib';
const assert = require('assert');
import bitcoinCtrl from "../controller/bitcoinCtrl";
import dbCtrl from "../controller/dbCtrl";
import config from "../config/config-main";

describe("BitcoinCtrl Mainnet", async () => {
    before(async () => {
        await dbCtrl.initDb(config.dbName);
        await bitcoinCtrl.init(config);
    });

    let address = "";

    /*
    it("get block height", async () => {
       const block = await bitcoinCtrl.api.getLastBlock();
       assert(block > 0);
    });

    it("should create a btc address", async () => {
        address = await bitcoinCtrl.createAddress(0);
        console.log(address)

        assert(address && bitcoin.address.fromBech32(address).data != null);
    });*/


    /*
    it('should return wallet deposits for given address', async () => {
        const tx = await bitcoinCtrl.api.getAddressDetail([address], null);
        console.log(tx);
        const detail = tx && tx[0];

        assert(detail && detail.transfers && detail.transfers.length >0);
    });*/

    it("should return all deposits in block number for users in db", async () => {
       const tx = await bitcoinCtrl.getTxOnBlock(661474);
       console.log(tx);

       assert(tx && tx[0] && tx[0].address === address);
    });
});
