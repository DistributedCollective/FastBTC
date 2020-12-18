# Fast-Btc-Relay

Relays Btc to RBtc. 
For every RBtc address provided by the user a BTC deposit addresses (p2wsh/p2ms) is generated from a multisig hd wallet (bip32).
A smart contract on Rsk provides RBtc which can be withdrawn from an authorized admin wallet.
A watcher is listening 24h-7 for incoming transactions on all created Btc deposit addresses. If a new transaction is detected the admin wallet credits the same amount on the users Rsk wallet address minus a small provision. A sqlite database keeps track of the deposits and withdrawals.
Improvements:
- Include automated Btc->RBtc conversion via 2WP.
- Eliminate trust on BTC deposits by integrating atomic swaps with the smart contract as counterparty.
- Improve security: the higher the amount the more confirmations should be waited for. 



### Requirements

NodeJs > 13.1  
Nodemon  
Webpack  


### Install

```sh
1. npm install
2. npm run build-client
3. Create empty directories "logs", "secrets" and "db"
4. Within "secrets" a file accounts.js with the credentials of the admin wallet

export default {
    "test": {
        adr: "0x..."
        pKey: ""
    },
    "main": {
        adr: "0x..."
        pKey: ""
    }
}

and telegram.js for telegram notifications on successful deposits/withdraws and errors

export default {
    infoBotToken: "...",
    errorBotToken: "..."
}
  
walletSigs.main.js for the multisigs hd wallet  
  

export default {
    myWordSeed: "12-words",
    pubKeys: [
        "pub-key1",
        "pub-key2"
    ]
}

To generate the keys run "npm run [genAdminTestnet | genAdminMainnet]" 3 times. Paste the 12 words from first output to "myWordSeed" and xpub from second output to pub-key1 and xpub from third output to pub-key2. 

and cryptocompare.js for btc price polling

export const apiKey = "...";

5. Set the block number of Btc test or mainnet on config/store.json from which polling should start
{
	"lastBlockNumber": 1897463
}
```


### Start

```sh
npm run start
```
Check the frontend at http://your-ip:port/ 


### Withdraw from Btc multisig

1. Make sure the database in db/ is up-to-date and matches the name in the config file, 
2. Add a receiver address on utils/withdrawBtc.js on line 7
3. Change the gasPrice on line 8 (optional)
3. Add the 12 seed words from one of the 3 accounts on line 9 and the private key of the second account on line 10,
3. then execute:  

```sh
npm run [withdrawBtcMainnet | withdrawBtcTestnet]
```


### Withdraw from the smart contract on Rsk

 1. Set the receiver in utils/withdrawRsk.js on line 6
 2. In case you are the admin you are done, in case you are the contract owner: add your private key and wallet address on line 8 and 9 and change the contract call from "withdrawAdmin" to "withdraw" on line 21
 3. Specify the amount on line 5,
 4. then execute

```sh
npm run [withdrawRskMainnet | withdrawRskTestnet]
```


### Control the database

Sqlite commandline tool: type sqlite3 in the shell, ctrl+d to exit


License
----

MIT
**Free Software, Hell Yeah!**
