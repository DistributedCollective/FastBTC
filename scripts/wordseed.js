import * as bip39 from "bip39";
import {bip32, networks} from "bitcoinjs-lib";
import * as ethUtils from 'ethereumjs-util';

const network = networks[process.argv[2]];
const path = network === networks.testnet ? "m/49'/1'/0'" : "m/49'/0'/0'";
//const path = "m/44/0/0/0";

async function genXPub() {
    const words = bip39.generateMnemonic();
    console.log(words)
    const seed = await bip39.mnemonicToSeed(words);
    const node = bip32.fromSeed(seed, network);
    const account = node.derivePath(path);
    console.log("xpub:", account.neutered().toBase58());
    console.log("xpriv:", account.toBase58());
    console.log("WIF:", account.toWIF());
}

async function exportPrivKey(words) {
    const seed = await bip39.mnemonicToSeed(words);
    const node = bip32.fromSeed(seed, network);
    const account = node.derivePath(path);
    console.log("WIF:", account.toWIF());
    console.log("xpriv:", account.toBase58());
    console.log("xpub:", account.neutered().toBase58());
}


async function exportPrivKeyRsk(words) {
    const seed = await bip39.mnemonicToSeed(words);
    const node = bip32.fromSeed(seed, network);
    const account = node.derivePath(path);
    console.log("WIF:", account.toWIF());
    console.log("xpriv:", account.toBase58());
    console.log("xpub:", account.neutered().toBase58());

    console.log(account.privateKey.toString('hex'));
    console.log(node.privateKey.toString('hex'));
    
    console.log("list addresses");

    for (let i = 0; i < 5; i++) {
        const derived = account.derive(i);
        const address = '0x' + ethUtils.privateToAddress(derived.privateKey).toString('hex');
        console.log('index', i, ' -> ', address);
    }
}


genXPub();
//exportPrivKey("");
//exportPrivKeyRsk("");
