import conf from '../config/config';
import rskCtrl from '../controller/rskCtrl';


const from ={
    adr: "",
    pKey: ""
};
changeAdmin("".toLowerCase());


async function changeAdmin(adr) {
    console.log("init rsk");
    await rskCtrl.init();

    rskCtrl.web3.eth.accounts.wallet.add(from.pKey);
    const receipt = await rskCtrl.contract.methods.changeAdmin(adr).send({
        from: from.adr,
        gas: 100000
    });
    console.log(receipt);
    return true;
}
