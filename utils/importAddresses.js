import dbCtrl from "../controller/dbCtrl";
import config from "../config/config";
import bitcoinCtrl from "../controller/bitcoinCtrl";

(async () => {
    await dbCtrl.initDb(config.dbName);
    await bitcoinCtrl.init();

    const users = await dbCtrl.userRepository.find({});
    console.log(users)
    
    if (users && users.length > 0) {

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            console.log("adding user "+user.id)
            const imported = await bitcoinCtrl.checkAddress(user.id, new Date(user.dateAdded));
            if (!imported) {
                console.log("user address failed to import", user.id, user.btcadr);
            }
        }
    }

    console.log("done");
})();
