import config from "../config/config";
import {bip32, ECPair, payments, Psbt} from "bitcoinjs-lib";
import bitcoinCtrl from "../controller/bitcoinCtrl";
import dbCtrl from "../controller/dbCtrl";
import * as bip39 from "bip39";

let receiverAddress = "", hdAccount;
const gasSatoshi = 40;
const key1SeedWords = "";
const key2PrivateKey = "";

console.log("Withdraw on "+config.env+ " network");
console.log("Bitcoin network set to");
console.log(bitcoinCtrl.network);

//withdraw();
withdrawSingle({
    id: 935,
    btcadr: "",
});

let total=0; 

async function withdraw() {
    try {
        await dbCtrl.initDb(config.dbName);
        await bitcoinCtrl.init();

        const mySeed = await bip39.mnemonicToSeed(key1SeedWords);
        const root = bip32.fromSeed(mySeed, bitcoinCtrl.network);
        hdAccount = root.derivePath(bitcoinCtrl.derivationPath);

        if (!receiverAddress) {
            receiverAddress = payments.p2pkh({pubkey: hdAccount.publicKey, network: bitcoinCtrl.network}).address;
        }

        console.log("Receiver address", receiverAddress);


        const limit = 10;
        let reachEnd = false;

        for (let i = 0; !reachEnd; i += limit) {
            const users = await dbCtrl.userRepository.find({}, { offset: i, limit: limit, orderBy: {id: 1}} );

            if (users && users.length > 0) {

                for (const user of users) {
                    console.log(user);
                    const res = await checkWithdrawUser(user, hdAccount);
                }
            } else {
                reachEnd = true;
                console.log("total: "+total);
                console.log("Withdraw done")
            }
        }

    } catch (e) {
        console.log(e)
    }
}

async function withdrawSingle(user){
    try {
        await dbCtrl.initDb(config.dbName);
        await bitcoinCtrl.init();

        const mySeed = await bip39.mnemonicToSeed(key1SeedWords);
        const root = bip32.fromSeed(mySeed, bitcoinCtrl.network);
        hdAccount = root.derivePath(bitcoinCtrl.derivationPath);

        const res = await checkWithdrawUser(user, hdAccount);
        console.log("done");

    } catch (e) {
        console.log(e)
    }
    
}

async function checkWithdrawUser(user, hdAccount) {
    try {
        console.log("... withdrawing from", user.btcadr);

        const index = user.id === 1 ? 0 : user.id;
        const {payment: userPayment} = await getPaymentAdr(index);
        const myChild = hdAccount.derive(0).derive(index);
        const partnerChild = bip32.fromBase58(key2PrivateKey, bitcoinCtrl.network).derive(0).derive(index);
        const keys = [
            ECPair.fromWIF(myChild.toWIF(), bitcoinCtrl.network),
            ECPair.fromWIF(partnerChild.toWIF(), bitcoinCtrl.network)
        ];

        if (userPayment.address !== user.btcadr) {
            throw "Wrong derived address for " + user.btcadr + " -> " + userPayment.address;
        }

        const {inputs, bal} = await getInputsData(userPayment);

        if (inputs.length > 0) {
            const fee = getFee(inputs.length, 2, gasSatoshi);

            if (bal > fee) {
                const psbt = new Psbt({ network: bitcoinCtrl.network })
                    .addInputs(inputs)
                    .addOutput({
                        address: receiverAddress,
                        value: Math.round(bal - fee)
                    });

                keys.forEach(key => psbt.signAllInputs(key));

                psbt.validateSignaturesOfAllInputs();
                psbt.finalizeAllInputs();

                const hash = psbt.extractTransaction().toHex();
                
                total+=bal;
                const tx = await bitcoinCtrl.api.sendRawTransaction(hash);
                console.log("withdraw tx", tx);
            }
        }

    } catch (e) {
        console.error("Error on withdraw")
        console.error(e);
    }
}

async function getPaymentAdr(index) {
    const publicKeys = config.walletSigs.pubKeys.map(key => {
        const node = bip32.fromBase58(key, bitcoinCtrl.network);
        const child = node.derive(0).derive(index);
        return child.publicKey;
    });

    const payment = payments.p2wsh({
        network: bitcoinCtrl.network,
        redeem: payments.p2ms({
            m: 2,
            pubkeys: publicKeys,
            network: bitcoinCtrl.network
        })
    });

    return { payment, publicKeys };
}

function getFee(inputs, outputs, gasSatoshi) {
    const totalBytes = (inputs * 148) + (outputs * 34) + 10 + -inputs;
    return Math.round(totalBytes * gasSatoshi);
}

async function getInputsData (payment) {
    try {
        const inputs = [];

        const [addressDetail] = await bitcoinCtrl.api.getAddressDetail([payment.address], null);
        let balance = 0;

        if (addressDetail && addressDetail.utxos) {
            if (addressDetail.balance > 0) {
                balance = Number(addressDetail.balance);

                for (let utxo of addressDetail.utxos) {
                    const tx = await bitcoinCtrl.api.getRawTx(utxo.transactionHash);

                    if (tx && tx.hex) {
                        const input = {
                            hash: utxo.transactionHash,
                            index: utxo.index,
                            nonWitnessUtxo: Buffer.from(tx.hex, 'hex'),
                            witnessScript: payment.redeem.output,
                        }
                        inputs.push(input);
                    }
                }
            }
        }

        return {inputs, bal: balance};
    } catch (e) {
        // console.log(e);
        return {};
    }
}
