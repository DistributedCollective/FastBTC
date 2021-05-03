import DbCtrl from './../controller/dbCtrl';
import config from '../config/config';
import Web3 from 'web3';
import * as fs from 'fs';

import {bip32, ECPair, payments, Psbt} from "bitcoinjs-lib";
import bitcoinCtrl from "../controller/bitcoinCtrl";
var io = require('socket.io-client');
var web3 = new Web3(config.nodeProvider);

import U from '../utils/helper';

const gasSatoshi = 10;
const keyPrivateKey = "tprv8fsQTfzxTrtYaBeAUGrFoUMeJiiF6PGVMK6KrTeFKMySrRNE7d5csnwxbSma9jZnUpjmG58NyiDFM5BhrZtoYEzDgbSXanDaev7LQVyDurS";
const key2PrivateKey = "tprv8fxQstaUiWDjRkESrtcoFoYcPCtoFu4VDPVyCAYc4eheQeedBcDpKPdfj7ApbBidav5hw9nVJtpAvmbjzfv4CoFSLKj32o2YGR7oTacJy3E";
const key3PrivateKey = "tprv8ggzMi47JhNk2ALSrrNfPRkoqpBTSjKsWpcZatsvipDGDJj4ohtyFweACsLxAti71D4jKSUsPRLxtigzfkQ9S3KNgrmjY181aonFmu6nhJc";
const cosigners = 2;

console.log("Withdraw on "+config.env+ " network");


const { origin, pathname } = new URL('http://13.59.127.115:3007/');
// const { origin, pathname } = new URL('http://localhost:3008/');

const socket = io(origin, {
    reconnectionDelayMax: 10000,
    path: pathname && pathname !== '/' ? pathname : '',
});


socket.on('connect', async function(){
    console.log("Socket connected");
});
const fromUser = {btcadr: 'tb1qz9mtgs0uupns3pva53wey3eu25628060zpgz58hlx99q3km32fasdd908w', id: 2};

start().catch(console.error);


async function start() {
    await DbCtrl.initDb(config.dbName);

    await checkTransferUser();

    // await depositInDifferentTx(1, 0.00003);

    await depositManyInOne(5, 0.00003);

    // await deposit2xSameAdr(1, 0.00003)
}

async function checkTransferUser() {
    const { payment: userPayment } = await getPaymentAdr(fromUser.id);
    if (userPayment.address !== fromUser.btcadr) {
        throw "Wrong derived address for " + fromUser.btcadr + " -> " + userPayment.address;
    }

    fromUser.payment = userPayment;

    await bitcoinCtrl.api.checkImportAddress(userPayment, 'test_deposit_' + Date.now(), new Date(), true);
}

async function depositInDifferentTx(nrUsers, depositAmount) {

    console.log("+ will deposit for %s users in different tx", nrUsers);

    let accts = createRskAccount(nrUsers);

    let i = 0, nrSuccess = 0;
    for(let a of accts) {

        console.log("- User %s ", i++);
        let user = await getAdr(a);
        console.log("user address res", user);

        const success = await depositToUsers(fromUser, depositAmount, [user]);
        if (success) nrSuccess++;
    }
    console.log("*****  Total success %s/%s", nrSuccess, accts.length);
}

async function depositManyInOne(nrUsers, depositAmount) {

    console.log("+ will deposit \"many in one\" for total %s users", nrUsers);

    let allAccs = createRskAccount(nrUsers);

    let batchSize, nrSuccess = 0;
    for(let i = 0; i < allAccs.length; i+= batchSize) {
        batchSize = Math.random()*5 + 15; //Random batch size from 15-20 users
        const batchedAccs = allAccs.slice(i, i+batchSize);
        if (batchedAccs.length > 0) {
            console.log("--- Depositing in batch for %s users", batchedAccs.length);
            const users = [];
            for (const acc of batchedAccs) {
                const user = await getAdr(acc);
                users.push(user);
            }
            console.log(users);

            const success = await depositToUsers(fromUser, depositAmount, users);
            if (success) nrSuccess ++;
        }
    }
    console.log("***** Total success batch %s", nrSuccess);
}

async function deposit2xSameAdr(nrUsers, depositAmount) {

    console.log("+ will deposit 2x output on same adr for total %s users", nrUsers);

    let accts = createRskAccount(nrUsers);

    let nrSuccess = 0, i = 0;
    for(let a of accts) {
        console.log("- User %s ", i++);
        let user = await getAdr(a);
        console.log("user address res", user);

        const success = await depositToUsers(fromUser, depositAmount, [user], 2);
        if (success) nrSuccess ++;
    }
    console.log("***** Total success %s", nrSuccess);
}




function createRskAccount(nr) {
    const l=[];
    for(let i=0;i<nr;i++) {
        const account = web3.eth.accounts.create();
        l.push(account.address.toLowerCase())
    }
    return l;
}

function getAdr(adr){
    return new Promise(resolve => {
        // const email = Math.random().toString(24).slice(3) + "@test.com";

        socket.emit("getDepositAddress", adr, (res, res2) => {
            if(res&&res.error) {
                console.error("Error retrieving history");
                console.error(res);
                return;
            }
            resolve(res2);
        });
    });
}


async function depositToUsers(fromUser, amount, toUsers, nrPerUser = 1) {

    try {
        const totalUser = toUsers.length;
        const psbt = new Psbt({network: bitcoinCtrl.network});
        const fee = getFee(psbt.inputCount, 2, gasSatoshi);
        const amountPerUser = amount * 1e8;
        const amountSat = Math.floor(amountPerUser * totalUser * nrPerUser);

        const {inputs, bal} = await getInputsData(fromUser.payment);

        if (inputs && inputs.length > 0 && bal > fee + amountSat) {
            psbt.addInputs(inputs);
            for (const user of toUsers) {
                for (let i = 0; i < nrPerUser; i++) {
                    psbt.addOutput({
                        address: user.btcadr,
                        value: amountPerUser
                    });
                }
            }
            psbt.addOutput({
                address: fromUser.btcadr,
                value: Math.floor(bal - fee - amountSat)
            });

            const myChild = bip32.fromBase58(keyPrivateKey, bitcoinCtrl.network).derive(0).derive(fromUser.id);
            const partnerChild = bip32.fromBase58(key2PrivateKey, bitcoinCtrl.network).derive(0).derive(fromUser.id);
            const partnerChild2 = bip32.fromBase58(key3PrivateKey, bitcoinCtrl.network).derive(0).derive(fromUser.id);
            const keys = [
                ECPair.fromWIF(myChild.toWIF(), bitcoinCtrl.network),
                ECPair.fromWIF(partnerChild.toWIF(), bitcoinCtrl.network),
                ECPair.fromWIF(partnerChild2.toWIF(), bitcoinCtrl.network)
            ].slice(0, cosigners);

            keys.forEach(key => psbt.signAllInputs(key));

            psbt.validateSignaturesOfAllInputs();
            psbt.finalizeAllInputs();

            const hash = psbt.extractTransaction().toHex();

            const tx = await bitcoinCtrl.api.sendRawTransaction(hash);

            if (tx) {
                console.log("Deposited %sBTC to %s users, tx %s", amount*nrPerUser*totalUser, toUsers.length, tx);
                console.log("users", toUsers.map(u => u.btcadr));
                await storeTx(tx);
                return true;
            } else {
                console.log("Deposits failed");
            }
        } else {
            console.error("Insufficient balance, bal: %s, fee+amount: %s", bal, fee + amountSat);
        }

    } catch (e) {
        console.error(e);
        console.log("*** Waiting for 5 minutes before send new deposits ***");
        await U.wasteTime(5 * 60);
    }
}

async function getPaymentAdr(index) {
    let publicKeys = bitcoinCtrl.getDerivedPubKeys(index);

    const payment = payments.p2wsh({
        network: bitcoinCtrl.network,
        redeem: payments.p2ms({
            m: cosigners,
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
                            // redeemScript: payment.redeem.output,
                        }
                        // console.log("input found")
                        // console.log(input)
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

let sentTxList = [];
async function storeTx(tx) {
    sentTxList.push(tx);
    fs.writeFileSync('./txlist.json', JSON.stringify(sentTxList, null, 2), 'utf8');
}