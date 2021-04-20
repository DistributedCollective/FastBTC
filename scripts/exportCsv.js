const { Parser } = require('json2csv');

/**
 * Exports all transactions to csv
 */

import conf from '../config/config-main';
import dbCtrl from '../controller/dbCtrl';
const fs = require('fs');
const fields = ['id', 'web3adr', 'btcadr', 'valueUsd', 'valueBtc','type','dateAdded'];
const opts = { fields };


exportDb();

async function exportDb() {
    await dbCtrl.initDb(conf.dbName);
    const sql = "select user.id, web3adr, btcadr, valueUsd, valueBtc, type, transactions.dateAdded"
        + " from user cross join transactions on user.label = transactions.userAdrLabel order by transactions.dateAdded"
    // +"AND web3adr = ''"

    dbCtrl.db.all(sql, [], (err, rows) => {
        if (err) {
            console.log('Error running sql: ' + sql);
            console.log(err);
        }
        else {
            console.log(rows);

            for (let i in rows) rows[i].dateAdded = new Date(rows[i].dateAdded);


            let csv;
            try {
                const parser = new Parser(opts);
                csv = parser.parse(rows);
                console.log(csv);
              } catch (err) {
                console.error(err);
              }


            
            fs.writeFile('tx.csv', JSON.stringify(csv), (err) => {
                if (err) {
                    throw err;
                }
                console.log("JSON data is saved.");
            });
        }
    });
}

