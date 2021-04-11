import {bip32, ECPair, networks, payments, Psbt} from "bitcoinjs-lib";
import * as bip39 from "bip39";
import config from '../config/config';


const pubKeys = [
            //account.neutered().toBase58(),
            ...config.walletSigs.pubKeys
        ];

const network = networks.bitcoin;


function getDerivedPubKeys(index) {
    let publicKeys = pubKeys.map(key => {
        const node = bip32.fromBase58(key, network);
        const child = node.derive(0).derive(index);
        return child.publicKey.toString('hex');
    });
    publicKeys.sort();
    publicKeys = publicKeys.map(k => Buffer.from(k, 'hex'));
    return publicKeys;
}

async function getPaymentAdr(index) {
    const publicKeys = getDerivedPubKeys(index);

    const payment = payments.p2sh({
        network: network,
        redeem: payments.p2ms({
            m: 3,
            pubkeys: publicKeys,
            network: network
        })
    });

    return { payment, publicKeys };
}

async function printAddresses(){
    //await dbCtrl.initDb("fastbtcrelay_main");
    //await bitcoinCtrl.init();
     
    for(let i = 0; i < 20; i++){
        const {payment: userPayment} = await getPaymentAdr(i);
        console.log(i+" "+userPayment.address);
    }
}

printAddresses();
