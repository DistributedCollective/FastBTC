/**
 * Helper and utilities functions
 */
import configs from '../config/config-main';
import fetch from 'node-fetch';

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
}

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
}


export default new Util();
