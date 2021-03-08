import rskCtrl from '../controller/rskCtrl';
import conf from '../config/config';

// add the necessary parameters here
changeCosigner("".toLowerCase(), "add");
 

async function changeCosigner(adr, action) {
    console.log("Changing Cosigner.\nInitializing RSK");
    await rskCtrl.init();

    const pKey = conf.account.pKey || rskCtrl.web3.eth.accounts.decrypt(conf.account.ks, process.argv[3]).privateKey;
    rskCtrl.web3.eth.accounts.wallet.add(pKey);
    let data;

    if (action === 'add') {
        data = rskCtrl.web3.eth.abi.encodeFunctionCall({
            name: 'addOwner',
            type: 'function',
            inputs: [{ "name": "owner", "type": "address" }]
        }, [adr]);
    } else if (action === 'remove') {
        data = rskCtrl.web3.eth.abi.encodeFunctionCall({
            name: 'removeOwner',
            type: 'function',
            inputs: [{ "name": "owner", "type": "address" }]
        }, [adr]);
    } else if (action === 'replace') {
        data = rskCtrl.web3.eth.abi.encodeFunctionCall({
            name: 'replaceOwner',
            type: 'function',
            inputs: [{ "name": "owner", "type": "address" }, { "name": "newOwner", "type": "address" }]
        }, [adr]);
    } else {
        console.log("Unknown action")
        return false;
    }

    try {
        const receipt = await rskCtrl.multisig.methods.submitTransaction(conf.contractAddress.toLowerCase(), 0, data).send({
            from: conf.account.adr.toLowerCase(),
            gas: 300000
        });
        console.log(receipt);
        return true;
    } catch (e) {
        console.log("Error", e)
        return null;
    }

}
