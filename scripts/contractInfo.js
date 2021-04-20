import rskCtrl from '../controller/rskCtrl';
import conf from '../config/config';


let numberOfTransactions;

async function getContractInfo() {
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();

    try {
        const cosigners = await rskCtrl.multisig.methods["getOwners"]().call();
        const adminOfSmartWallet = await rskCtrl.contract.methods["admin"]().call();
        const ownerOfSmartWallet = await rskCtrl.contract.methods["owner"]().call();
        const signaturesRequired = await rskCtrl.multisig.methods["required"]().call();
        numberOfTransactions = await rskCtrl.multisig.methods["getTransactionCount"](true, true).call();
    
        console.log("Managed wallet address: "+conf.contractAddress);
        console.log("Multisig contract address: "+conf.multisigAddress);
        console.log("Cosigners are", cosigners);
        console.log("Required signatures: "+signaturesRequired);
        console.log("Admin of managedWallet is ",adminOfSmartWallet);
        console.log("Owner of managedWallet is ",ownerOfSmartWallet);
        console.log("Secrets/admin: "+conf.account.adr);
        console.log("Number of tx: ",numberOfTransactions);
    } catch (e) {
        console.log("\nError getting cosigners", e)
        return null;
    }

    getProposals();
}

async function getProposals(txId){
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();

    try{
        if(txId){
        const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txId).call();
        console.log(isConfirmed);
        }
        else {
            for(let i=0; i < numberOfTransactions;i++){
                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](i).call();
                const txObj = await rskCtrl.multisig.methods["transactions"](i).call();
                console.log(i+": is confirmed: "+isConfirmed+", is executed: "+txObj.executed);
            }
        }
    }
    catch(e){
        console.error("Error getting confirmed info");
        console.error(e);
        return true; //need to be true to not be processed again
    }
}

getContractInfo();
//getProposals();