import * as bip39 from "bip39";
import {bip32, networks} from "bitcoinjs-lib";

const network = networks[process.argv[2]];
const path = network === networks.testnet ? "m/49'/1'/0'" : "m/49'/0'/0'";

async function genXPub() {
    const words = bip39.generateMnemonic();
    console.log(words)
    const seed = await bip39.mnemonicToSeed(words);
    const node = bip32.fromSeed(seed, network);
    const account = node.derivePath(path);
    console.log("xpub:", account.neutered().toBase58());
    console.log("xpriv:", account.toBase58());
}

async function exportPrivKey(words) {
    const seed = await bip39.mnemonicToSeed(words);
    const node = bip32.fromSeed(seed, network);
    const account = node.derivePath(path);
    console.log("WIF:", account.toWIF());
    console.log("xpriv:", account.toBase58());
    console.log("xpub:", account.neutered().toBase58());
}

//genXPub();
exportPrivKey("");
