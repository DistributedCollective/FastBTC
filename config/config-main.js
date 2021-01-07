import telegram from '../secrets/telegram';
import {apiKey} from '../secrets/cryptocompare';
import walletSigs from "../secrets/walletSigs.main";
import node from '../secrets/btcNode';
import accounts from "../secrets/accounts";

export default {
    env: "prod", 
    serverPort: 3007,
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
    telegramGroupId: -1001308978723,
    cryptoCompareKey: apiKey,
    pricePollingTime: 3*1000*60, //poll Btc price every 3 minutes
    walletSigs: walletSigs,
    contractAddress: "0xca1C5B1bc55755C5e3b6Ed1afE88ABD7B26F147f".toLowerCase(),
    account: accounts["main"],
    node: node.main
}