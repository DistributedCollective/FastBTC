/**
 * Rsk ctrl test
 */

const assert = require('assert');
import conf from '../config/config-test';
import rskCtrl from '../controller/rskCtrl';
import { encodeParameters, etherUnsigned } from '../utils/ethereum';

describe('Rsk controller', async () => {
    describe('#check', async () => {
         before(async () => {
            console.log("init rsk");
            await rskCtrl.init();
        });
        
        it('should refuse to send the amount because it exceeds the limits', async () => {
            const adr = conf.wallet.adr;
            const val = (conf.maxAmountInUsd+1)*1e8/10000;
            const res = await rskCtrl.sendRsk(val, adr);
            if(res.error) console.log(res.error);
            assert(res.error.indexOf("send between")!=-1);
        });       
        
        it('should refuse to send the amount because it exceeds the wallet balance', async () => {
            const adr = conf.wallet.adr;
            const val = (conf.maxAmountInUsd*1000000)*1e8;
            const res = await rskCtrl.sendRsk(val, adr);
            if(res.error) console.log(res.error);
            assert(res.error.indexOf("balance")!=-1);
        });  
        
        
        it('should send 0.0015 rbtc to itself', async () => {
            let val = 0.0015; // btc
            val = val/0.00000001; //satoshi
            const adr = conf.wallet.adr;
            const res = await rskCtrl.sendRsk(val, adr);
            console.log(res);
            assert(res.txHash);
        });

        it('should init a transaction in the multisig', async () => {
            let val = 0.0015; // btc
            val = val/0.00000001; //satoshi
            const data = encodeParameters(["uint256"], [etherUnsigned(24 * 60 * 60).multipliedBy(2).toFixed()]);

            const res = await rskCtrl.multisig.methods.submitTransaction(conf.contractAddress, val, data);
            console.log(res);
            assert(res.txHash);
        });

        it('should init a transaction in the multisig', async () => {
            const txHash = "0xd10022ab33a701b896451aad4451a2c89ad1be6e7b7e4950081170ff221b5d7c"
            const res = await rskCtrl.multisig.methods.confirmTransaction(txHash);
            console.log(res);
            assert(true);
        });
    });
});