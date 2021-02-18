import dbCtrl from "../controller/dbCtrl";
import config from "../config/config-test";
import bitcoinCtrl from "../controller/bitcoinCtrl";

(async () => {
    await dbCtrl.initDb(config.dbName);
    await bitcoinCtrl.init(config);

    const users = await dbCtrl.userRepository.find({});

    if (users && users.length > 0) {

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const imported = await bitcoinCtrl.checkAddress(user.id, user.label, new Date(user.dateAdded), true);
            if (!imported) {
                console.log("user address failed to import", user.id, user.btcadr);
            } else {
                console.log('imported address', user.btcadr);
            }
        }
    }

    console.log("done");
})();
