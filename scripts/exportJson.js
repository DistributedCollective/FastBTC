/**
 * Exports all transactions to json
 */

import conf from '../config/config-main';
import dbCtrl from '../controller/dbCtrl';
const fs = require('fs');

exportDb();

const stats = {
    totalUsd:0,
    totalBtc:0
};

async function exportDb() {
    await dbCtrl.initDb(conf.dbName);
    const sql = "select user.id, web3adr, btcadr, valueUsd, valueBtc, type, transactions.dateAdded"
        + " from user cross join transactions on user.label = transactions.userAdrLabel "
    // +"AND web3adr = ''"

    dbCtrl.db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error running sql: ' + sql);
            console.error(err);
        }
        else {
            console.log(rows);

            for (let i in rows) {
                rows[i].dateAdded = new Date(rows[i].dateAdded);
                stats.totalUsd+=rows[i].valueUsd;
                stats.totalBtc+=rows[i].valueBtc/100000000;
            }

            console.log(stats);

            fs.writeFile('tx.json', JSON.stringify(rows), (err) => {
                if (err) {
                    throw err;
                }
                console.log("JSON data is saved.");
            });
        }
    });
}

