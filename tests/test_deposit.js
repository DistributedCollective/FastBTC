import DbCtrl from './../controller/dbCtrl';
import config from '../config/config';
import Web3 from 'web3';
import * as fs from 'fs';

import {bip32, ECPair, payments, Psbt} from "bitcoinjs-lib";
import bitcoinCtrl from "../controller/bitcoinCtrl";
var io = require('socket.io-client');
var web3 = new Web3(config.nodeProvider);

import U from '../utils/helper';

const gasSatoshi = 50;
const keyPrivateKey = "tprv8ZgxMBicQKsPe2DbCHzPWRdSKcKzNEEQZL937uphUyEAFiBUWi5LPNLZuTAudp62hXXTDFt2jWTKnuvA1zoACbRNBkeQZ6FB2W54qsZ2rAM";
const key2PrivateKey = "tprv8ZgxMBicQKsPfDaTXNDjPwKPehR6dPwvDAuv28TfWkzm6BcsAZXnCZ2d99xbw4BMskay5eKMqdwAAwCCMfVHpBdBySr1z4PBMfL45ZihjLh";
const key3PrivateKey = "tprv8ZgxMBicQKsPdKrpMMySPDFSp8xc8yTC5J9kY6WUAXWtBNtWbWBRMqBJRUmvnQw83BgV722KfNE7nx1NQjwWbhb5SHpXr1YgCtySSXZD29a";
const cosigners = 2;

console.log("Withdraw on "+config.env+ " network");


const txAmount = 3000;
const TX_FEES = 3000;
// const { origin, pathname } = new URL('https://testnet.sovryn.app/genesis/');
const { origin, pathname } = new URL('http://localhost:3008/');

const socket = io(origin, {
    reconnectionDelayMax: 10000,
    path: pathname && pathname !== '/' ? pathname : '',
});


socket.on('connect', async function(){
    console.log("Socket connected");
});

init();

async function init() {
    await DbCtrl.initDb(config.dbName);
    await bitcoinCtrl.init();

    createNewDepositeAddress();
}

async function createNewDepositeAddress() {
    // let depositSum = await DbCtrl.transactionRepository.sumTransacted('deposit');
    //
    // if (depositSum > config.maxDepositsAllocation) {
    //   console.log("Total deposited transactions (%s) is exceed the max allocation", depositSum/1e8);
    //   return;
    // }
    //
    // const remainDeposits = config.maxDepositsAllocation - depositSum;
    // const nrUsers = Math.floor(remainDeposits / (depositAmount * 1e8));
    const depositAmount = 0.0001;
    const nrUsers = 1000;

    console.log("will deposit for %s users", nrUsers);

    let accts = createAccount(nrUsers);
    const fromUser = {btcadr: '2N2waMD8dtSiTcE8AVSu5uJJDHnPe2FDdA8', id: 1};

    const { payment: userPayment } = await getPaymentAdr(fromUser.id);
    if (userPayment.address !== fromUser.btcadr) {
      throw "Wrong derived address for " + fromUser.btcadr + " -> " + userPayment.address;
    }

    // await bitcoinCtrl.api.checkImportAddress(userPayment, 'thisisHaTestWallet2', new Date(), true);

    let i = 0;
    for(let a of accts) {

        console.log("********* User %s ********", i++);
        let user = await getAdr(a);
        console.log("user address res", user);

        await depositToUser(fromUser, userPayment, user, depositAmount);
    }
}




function createAccount(nr) {
    const l=[];
    for(let i=0;i<nr;i++) {
        var account = web3.eth.accounts.create();
        let out = {adr: account.address, pKey:account.privateKey};
        //console.log(out);
        // console.log("'"+account.address.toLowerCase()+"',");
        l.push(account.address.toLowerCase())
    }
    return l;
}

function getAdr(adr){
    return new Promise(resolve => {
        // console.log("get adr", adr);
        const email = Math.random().toString(24).slice(3) + "@test.com";

        socket.emit("getDepositAddress", adr, email, (res, res2) => {
            if(res&&res.error) {
                console.error("Error retrieving history");
                console.error(res);
                return;
            }
            
            // console.log("response");
            // console.log(res);
            // console.log(res2)
            resolve(res2);
        });
    });
}


async function depositToUser(fromUser, fromPayment, toUser, amount) {

  try {
    const psbt = new Psbt({network: bitcoinCtrl.network});
    const fee = getFee(psbt.inputCount, 2, gasSatoshi);
    const amountSat = amount*1e8;

    const {inputs, bal} = await getInputsData(fromPayment);

    if (inputs && inputs.length > 0 && bal > fee + amountSat) {
      psbt.addInputs(inputs);
      psbt.addOutput({
        address: toUser.btcadr,
        value: amountSat
      });
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
        console.log("Deposited %sBTC to user %s, tx %s", amount, toUser.btcadr, tx);
        await storeTx(tx);
        return true;
      } else {
        console.log("Deposits failed for user", toUser.btcadr);
      }
    }

  } catch (e) {
    console.error(e);
    console.log("*** Waiting for 5 minutes before send new deposits ***");
    await U.wasteTime(5*60);
  }
}

async function getPaymentAdr(index) {
    let publicKeys = bitcoinCtrl.getDerivedPubKeys(index);

    const payment = payments.p2sh({
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
                            //witnessScript: payment.redeem.output,
                            redeemScript: payment.redeem.output,
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
