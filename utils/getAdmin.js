import rskCtrl from '../controller/rskCtrl';


export default async function getCosigners() {
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();

    try {
        const cosigners = await rskCtrl.multisig.methods["getOwners"]().call();
        const adminOfSmartWallet = await rskCtrl.contract.methods["admin"]().call();
        const ownerOfSmartWallet = await rskCtrl.contract.methods["owner"]().call();
    
        console.log("\nCosigners are", cosigners);
        console.log("Admin is ",adminOfSmartWallet);
        console.log("Onwer is ",ownerOfSmartWallet);
    } catch (e) {
        console.log("\nError getting cosigners", e)
        return null;
    }
}

getCosigners();