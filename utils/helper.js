/**
 * Helper and utilities functions
 */
import configs from '../config/config-main';
import fetch from 'node-fetch';
import * as util from 'ethereumjs-util';
import Web3 from 'web3';

const web3 = new Web3();

const getCryptoPrice = async (crypto) => {
    try {
        const res = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${crypto}&tsyms=USD&api_key=` + configs.cryptoCompareKey);
        const data = await res.json();
        if (data && data[crypto] && data[crypto]['USD']) {
            return Number(data[crypto]['USD']);
        } else {
            console.error("error getting price from cryptocompare");
            console.error(data);
            return Promise.reject("Can not get price for " + crypto);
        }
    }
    catch (e) {
        return Promise.reject("Error retrieving price for " + crypto);
    }
};

class Util {
    async wasteTime(s) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, s * 1000);
        });
    }

    async getRandomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    async getBTCPrice() {
        return await getCryptoPrice('BTC');
    }

    async getRbtcPrice() {
        return await getCryptoPrice('RBTC');
    }

    ecrecover(message, signature) {
        const res = util.fromRpcSig(signature);
        const pubKey = util.ecrecover(util.toBuffer(web3.utils.sha3(message)), res.v, res.r, res.s);
        const addrBuf = util.pubToAddress(pubKey);
        return util.bufferToHex(addrBuf);
    }
}

export default new Util();