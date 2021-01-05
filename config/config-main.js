import telegram from '../secrets/telegram';
import {apiKey} from '../secrets/cryptocompare';
import walletSigs from "../secrets/walletSigs.main";
import node from '../secrets/btcNode';
import accounts from "../secrets/accounts";

export default {
    env: "prod", 
    serverPort: 3020,
    healthMonitorPort: 17, //->3017
    appName: "Fast-btc-relay",
    dbName: "fastbtcrelay_main",
    rskNode: "https://mainnet.sovryn.app/rpc",
    commissionPercent: 1,
    minAmount: 100000, //sats, = 0.001 btc
    maxAmountInUsd: 3000,
    toleranceMax: 30,
    toleranceMin: 3,
    infoBot: telegram.infoBotToken,
    errorBot: telegram.errorBotToken,
    sendTelegramNotifications: true,
    cryptoCompareKey: apiKey,
    pricePollingTime: 3*1000*60, //poll Btc price every 3 minutes
    walletSigs: walletSigs,
    contractAddress: "0x794fEeB976f64910Bd2Dc6d1D9cB02E9174937Ab".toLowerCase(),
    account: accounts["main"],
    node: node.main
}