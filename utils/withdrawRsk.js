import conf from '../config/config';
import rskCtrl from '../controller/rskCtrl';

const v =  ""; // btc
const receiver = "";

withdraw(v, receiver);


async function withdraw(val, to) {
    console.log("init rsk");
    await rskCtrl.init();

    const amount = rskCtrl.web3.utils.toWei(val, "Ether");
    const from = {
        adr: conf.account.adr,
        pKey: rskCtrl.web3.eth.accounts.decrypt(conf.account.ks, process.argv[3]).privateKey
    }
    rskCtrl.web3.eth.accounts.wallet.add(from.pKey);

    const receipt = await rskCtrl.contract.methods.withdrawAdmin(to.toLowerCase(), amount).send({
        from: from.adr,
        gas: 100000
    });
    console.log(receipt);
    return true;
}

async function withdrawList(){
    for(let i of list){
        console.log(i)
        let res = await withdraw(i[1],i[0]);
    }
}

const list=["adr","val-in-btc"];

//withdrawList();