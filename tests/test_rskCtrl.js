/**
 * Rsk ctrl test
 */

const assert = require('assert');
import conf from '../config/config-test';
import rskCtrl from '../controller/rskCtrl';

describe('Rsk controller', async () => {
    describe('#check', async () => {
         before(async () => {
            console.log("init rsk");
            await rskCtrl.init();
        });
        
        it('should refuse to send the amount because it exceeds the limits', async () => {
            const adr = conf.account.adr;
            // const val = (conf.maxAmountInUsd+1)*1e8/10000;
            const val = (conf.maxAmount+1)*1e8/10000;
            const res = await rskCtrl.sendRbtc(val, adr);
            if(res.error) console.log(res.error);
            assert(res.error.indexOf("send between")!=-1);
        });       
        
        it('should refuse to send the amount because it exceeds the wallet balance', async () => {
            const adr = conf.account.adr;
            //const val = (conf.maxAmountInUsd*1000000)*1e8;
            const val = (conf.maxAmount*1000000)*1e8;
            const res = await rskCtrl.sendRbtc(val, adr);
            if(res.error) console.log(res.error);
            assert(res.error.indexOf("balance")!=-1);
        });  
        
        
        it('should send 0.0015 rbtc to itself', async () => {
            let val = rskCtrl.web3.toWei("0.000015", "Ether");; // btc
            const adr = conf.account.adr;
            const res = await rskCtrl.sendRbtc(val, adr);
            console.log(res);
            assert(res.txHash);
        });

        it('should init a transaction in the multisig', async () => {
            const val = rskCtrl.web3.utils.toWei("1", "ether"); // eth
            const receipt = await rskCtrl.transferFromMultisig(val, conf.account.adr)
            console.log(receipt);
            assert(receipt);
        });

        it('should init a transaction in the multisig', async () => {
            const txHash = "0xd10022ab33a701b896451aad4451a2c89ad1be6e7b7e4950081170ff221b5d7c"
            const res = await rskCtrl.multisig.methods.confirmTransaction(txHash);
            console.log(res);
            assert(true);
        });
    });
});