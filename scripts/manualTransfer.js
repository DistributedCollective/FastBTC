/**
 * Manual rBtc transfer for transfers outside the limit
 */

import conf from '../config/config-main';
import rskCtrl from '../controller/rskCtrl';

/**
 * amount in sats
 */
async function transfer(to, amount) {
    console.log("init rsk");
    await rskCtrl.init(conf);

    const val = rskCtrl.web3.utils.toWei(amount, "Ether");

    const receipt = await rskCtrl.web3.eth.sendTransaction({
        from: rskCtrl.from,
        to: to,
        value: val,
        gas: 25000
    });
    
    if (receipt.transactionHash) console.log("Successfully transferred " + amount + " to " + to);
    else console.log("Error on transfer");
    
    console.log(receipt);
}

transfer("", "0.0015");

