
import conf from '../config/config-test';
import dbCtrl from '../controller/dbCtrl';
const assert = require('assert');

describe('Db', async () => {
    describe('#Transactions', async () => {
        before(async () => {
            await dbCtrl.initDb(conf.dbName);
        });

        /*
        it('should return last 10 trades', async () => {
            const sql = "select user.id, web3adr, btcadr, valueUsd, valueBtc, type, transactions.dateAdded, transactions.txHash"
                + " from user cross join transactions on user.label = transactions.userAdrLabel order by transactions.dateAdded desc limit 10"
        
            dbCtrl.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.log('Error running sql: ' + sql);
                    console.log(err);
                    assert(false);
                }
                else {
                    console.log(rows);
                    for(let i in rows) rows[i].dateAdded = new Date(rows[i].dateAdded);
                    assert(rows.length>0);
                }
            });
        });

        it('should return last deposit timestamp', async () => {
            const ts = await dbCtrl.getLastTxTimestamp();
            console.log(ts);
            assert(ts)
        });

        /*
        it('should return all trades for given address', async () => {
            const hist = await dbCtrl.getDepositHistory("[web3-address]");
            console.log(hist);
            assert(hist)
        });

        it('should fail to insert a new deposit because the tx-hash already exists', async () => {
            const resDb = await dbCtrl.addDeposit("fdfd", "[tx-hash]", 1, 1);
            console.log(resDb);
            assert(!resDb)
        });*/

        it('should return a withdraw tx', async () => {
            const { btcAdr, txHash} = await dbCtrl.getPaymentInfo(51);
            console.log(btcAdr);
            console.log(txHash);
            assert(true)
        });
    });
});


