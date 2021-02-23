import rskCtrl from '../controller/rskCtrl';


const from ={
    adr: "",
    pKey: ""
};
changeConsigner("".toLowerCase(), "".toLowerCase(), "".toLowerCase());


async function changeConsigner(adr, action, adr2) {
    console.log("Changing Consigner.\n Initializing RSK");
    await rskCtrl.init();

    const pKey = rskCtrl.web3.eth.accounts.decrypt(from.ks, process.argv[3]).privateKey;
    rskCtrl.web3.eth.accounts.wallet.add(pKey);
    let receipt
    if (action === 'add') {
        receipt = await rskCtrl.multisig.methods.addOwner(adr).send({
            from: from.adr,
            gas: 100000
        });
    } else if (action === 'remove') {
        receipt = await rskCtrl.multisig.methods.removeOwner(adr).send({
            from: from.adr,
            gas: 100000
        });
    } else if (action === 'replace') {
        receipt = await rskCtrl.multisig.methods.replaceOwner(adr, adr2).send({
            from: from.adr,
            gas: 100000
        });
    } else {
        console.log("Unknown action")
    }

    console.log(receipt);
    return true;
}
