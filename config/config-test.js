import telegram from '../secrets/telegram';
import {apiKey} from '../secrets/cryptocompare';
import walletSigs from "../secrets/walletSigs.test";
import accounts from "../secrets/accounts";
import node from '../secrets/btcNode';

export default {
    env: "test", 
    serverPort: 3009,
    healthMonitorPort: 17, //->3017
    appName: "Fast-btc-relay",
    dbName: "fastbtcrelaytest3",
    rskNode: "https://testnet.sovryn.app/rpc",
    commission: 12000, //sats
    minAmount: 100000, //sats, = 0.001 btc
    maxAmountInUsd: 300,
    toleranceMax: 30,
    toleranceMin: 3,
    infoBot: telegram.infoBotToken,
    errorBot: telegram.errorBotToken,
    sendTelegramNotifications: true,
    telegramGroupId: 1352461392,
    cryptoCompareKey: apiKey,
    pricePollingTime: 5*60*1000, //poll Btc price every 5 minutes
    contractAddress: "0xcC099752238b1932587bf5793Afeb7d80D04F6e1".toLowerCase(),
    account: accounts["test"],
    walletSigs: walletSigs,
    node: node.test
}