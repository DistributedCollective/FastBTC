import rskCtrl from '../controller/rskCtrl';
import conf from '../config/config';

async function getCosigners() {
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();

    try {
        const cosigners = await rskCtrl.multisig.methods["getOwners"]().call();
        const adminOfSmartWallet = await rskCtrl.contract.methods["admin"]().call();
        const ownerOfSmartWallet = await rskCtrl.contract.methods["owner"]().call();
        const signaturesRequired = await rskCtrl.multisig.methods["required"]().call();
        const numberOfTransactions = await rskCtrl.multisig.methods["getTransactionCount"](true, true).call();
    
        console.log("Managed wallet address: "+conf.contractAddress);
        console.log("Multisig contract address: "+conf.multisigAddress);
        console.log("\nCosigners are", cosigners);
        console.log("Required signatures: "+signaturesRequired);
        console.log("Admin is ",adminOfSmartWallet);
        console.log("Onwer is ",ownerOfSmartWallet);
        console.log("Secrets/admin: "+conf.account.adr);
        console.log("Number of tx: ",numberOfTransactions);
    } catch (e) {
        console.log("\nError getting cosigners", e)
        return null;
    }
}

async function getProposal(txId){
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();

    try{
        const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txId).call();
        console.log(isConfirmed);
    }
    catch(e){
        console.error("Error getting confirmed info");
        console.error(e);
        return true; //need to be true to not be processed again
    }
}

getCosigners();

getProposal(1);