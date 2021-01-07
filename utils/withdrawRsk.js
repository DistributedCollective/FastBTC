import conf from '../config/config';
import rskCtrl from '../controller/rskCtrl';

const v =  ""; // btc
const receiver = "";

const from = {
    adr: conf.account.adr,
    pKey: conf.account.pKey
}
withdraw(v, receiver);

async function withdraw(val, to) {
    console.log("init rsk");
    await rskCtrl.init();

    rskCtrl.web3.eth.accounts.wallet.add(from.pKey);

    const amount = rskCtrl.web3.utils.toWei(val, "Ether");

    const receipt = await rskCtrl.contract.methods.withdrawAdmin(to.toLowerCase(), amount).send({
        from: from.adr,
        gas: 100000
    });
    console.log(receipt);
}