/**
 * Helper and utilities functions
 */
import configs from '../config/config-main';
import fetch from 'node-fetch';
import * as util from 'ethereumjs-util';
import Web3 from 'web3';

const web3 = new Web3();


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

    ecrecover(message, signature) {
        const res = util.fromRpcSig(signature);
        const pubKey = util.ecrecover(util.toBuffer(web3.utils.sha3(message)), res.v, res.r, res.s);
        const addrBuf = util.pubToAddress(pubKey);
        return util.bufferToHex(addrBuf);
    }
}

export default new Util();