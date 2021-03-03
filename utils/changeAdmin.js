import rskCtrl from '../controller/rskCtrl';


const from ={
    adr: "",
    pKey: ""
};

changeAdmin("".toLowerCase());


async function changeAdmin(adr) {
    console.log("Changing Admin.\n Initializing RSK");
    await rskCtrl.init();

    const pKey = from.pKey?from.pKey:rskCtrl.web3.eth.accounts.decrypt(from.ks, process.argv[3]).privateKey;
    rskCtrl.web3.eth.accounts.wallet.add(pKey);
    const receipt = await rskCtrl.contract.methods.changeAdmin(adr).send({
        from: from.adr,
        gas: 100000
    });
    console.log(receipt);
    return true;
}
