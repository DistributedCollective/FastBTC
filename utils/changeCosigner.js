import rskCtrl from '../controller/rskCtrl';
import conf from '../config/config';

const from ={
    adr: "",
    pKey: ""
};
changeCosigner("".toLowerCase(), "".toLowerCase(), "".toLowerCase());


async function changeCosigner(adr, action, adr2) {
    console.log("Changing Cosigner.\n Initializing RSK");
    await rskCtrl.init();

    const pKey = rskCtrl.web3.eth.accounts.decrypt(from.ks, process.argv[3]).privateKey;
    rskCtrl.web3.eth.accounts.wallet.add(pKey);
    let data
    if (action === 'add') {
        data = this.web3.eth.abi.encodeFunctionCall({
            name: 'addOwner',
            type: 'function',
            inputs: [{ "name": "owner", "type": "address" }]
        }, [adr]);
    } else if (action === 'remove') {
        data = this.web3.eth.abi.encodeFunctionCall({
            name: 'removeOwner',
            type: 'function',
            inputs: [{ "name": "owner", "type": "address" }]
        }, [adr]);
    } else if (action === 'replace') {
        data = this.web3.eth.abi.encodeFunctionCall({
            name: 'replaceOwner',
            type: 'function',
            inputs: [{ "name": "owner", "type": "address" }, { "name": "newOwner", "type": "address" }]
        }, [adr]);
    } else {
        console.log("Unknown action")
        return false;
    }
    const receipt = await await rskCtrl.multisig.methods.submitTransaction(conf.contractAddress, 0, data).send({
        from: from.adr,
        gas: 100000
    });

    console.log(receipt);
    return true;
}
