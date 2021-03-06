# Fast-Btc-Relay

Relays Btc to RBtc.
For every RBtc address provided by the user a BTC deposit addresses (p2sh/p2ms) is generated from a multisig hd wallet (bip32).
A smart contract[1] on Rsk provides RBtc which can be withdrawn from an authorized admin wallet[2].
A watcher is listening 24h-7 for incoming transactions on all created Btc deposit addresses. If a new deposit transaction is
detected a withdraw transaction with the same amount minus a small commision is initiated on the Rsk multisig contract.
N confirmation nodes[3] approve the withdraw request after requesting the Btc transaction hash and address.
A sqlite database keeps track of the deposits and withdrawals.

*Improvements:*

- Include automated Btc->RBtc conversion via 2WP.
- Eliminate trust on BTC deposits by integrating atomic swaps with the smart contract as counterparty.
- Improve security: the higher the amount the more confirmations should be waited for.

*Links:*

1. https://github.com/DistributedCollective/ManagedWallet/blob/master/contracts/ManagedWallet.sol

2. https://github.com/DistributedCollective/Sovryn-smart-contracts/blob/development/contracts/multisig/MultiSigWallet.sol
3. https://github.com/DistributedCollective/fastBTC-confirmation-node

### Requirements

NodeJs > 13.1
Nodemon
Webpack


### Install

1. `npm install`
2. `npm run build-client`
3. Create empty directories `logs`, `secrets` and `db`
4. Set the managed wallet and multisig contract addresses in config/[config_mainnet | config_testnet]
5. Within `secrets` a file `accounts.js` with the credentials of the admin wallet

```javascript
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
```

You can also choose to encrypt your wallet. If you do so, remember to add your encryption password when running the start command like so:

```sh
npm run start:main yourpassword
```
`accounts.js` it should then look like:

```javascript
export default {
    "test": {
        adr: "0x..."
        ks: {...}
    },
    "main": {
        adr: "0x..."
        ks: {...}
    }
}
```

and secrets/telegram.js for telegram notifications on successful deposits/withdraws and errors

```
export default "bot-token-id";
```

Add walletSigs.main.js  and walletSigs.test.js for the multisigs hd wallet

```sh
export default {
    pubKeys: [
        "tpub...",
        "tpub...",
        "tpub..."
    ],
    cosigners:2
}
```
In case only one network is used add the other one with the example data from above.

To generate the signing keys run "npm run [genAdminTestnet | genAdminMainnet]" and add the xpub from the output to pubKeys array.


Add secrets/btcNode.js with the credentials of a Btc node for main and testnet


```javascript
export default {
    main: {
        url: "",
        user: "",
        password: ""
    },
    test: {
        url: "",
        user: "",
        password: ""
    }
}
```

And last but not least the signer addresses of the confirmation nodes in `secrets/slaves.js`.


```javascript
export default {
    test:
        [
            "0xcafecafecafe".toLowerCase(),
            ...
        ],
    main:
        [
            "0xcafecafecafe".toLowerCase(),
            ....
        ]
}
```


### Initializing / upgrading the db

The migrations are handled by `db-migrate`. Run

```sh
node_modules/db-migrate/bin/db-migrate --env dev up
```

to initialize/upgrade the database.

Alternatively there are environment aliases `testnet` and `mainnet`. The migrations are not
currently run automatically. The environments and db locations are configured in `database.json`.


### Start

```sh
npm run start [mainnet | testnet] [walletpassword]
```

Check the frontend at http://your-ip:port/


License
----

MIT
**Free Software, Hell Yeah!**
