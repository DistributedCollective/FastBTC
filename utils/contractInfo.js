import rskCtrl from '../controller/rskCtrl';
import conf from '../config/config';

export default async function getCosigners() {
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();

    try {
        const cosigners = await rskCtrl.multisig.methods["getOwners"]().call();
        const adminOfSmartWallet = await rskCtrl.contract.methods["admin"]().call();
        const ownerOfSmartWallet = await rskCtrl.contract.methods["owner"]().call();
        const signaturesRequired = await rskCtrl.multisig.methods["required"]().call();
    
        console.log("Managed wallet address: "+conf.contractAddress);
        console.log("Multisig contract address: "+conf.multisigAddress);
        console.log("\nCosigners are", cosigners);
        console.log("Required signatures: "+signaturesRequired);
        console.log("Admin is ",adminOfSmartWallet);
        console.log("Onwer is ",ownerOfSmartWallet);
        console.log("Secrets/admin: "+conf.account.adr);
    } catch (e) {
        console.log("\nError getting cosigners", e)
        return null;
    }
}

getCosigners();