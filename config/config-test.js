import telegram from '../secrets/telegram';
import walletSigs from "../secrets/walletSigs.test";
import node from '../secrets/btcNode';
import accounts from "../secrets/accounts";


export default {
    env: "test", 
    serverPort: 3007,
    appName: "FastBtcV3",
    dbName: "fastbtcv3_test",
    rskNode: "https://testnet.sovryn.app/rpc",
    commission: 10000, //in sats
    minAmount: 100000, //sats, = 0.001 btc
    maxAmount: 1000000, //sats, = 0.1 btc
    infoBot: telegram.infoBotToken,
    errorBot: telegram.errorBotToken,
    sendTelegramNotifications: true,
    telegramGroupId: 1352461392,
    walletSigs: walletSigs,
    contractAddress: "0xcC099752238b1932587bf5793Afeb7d80D04F6e1".toLowerCase(),
    account: accounts["test"],
    node: node.test,
    thresholdConfirmations: 1
}