import telegramBot from '../secrets/telegram';
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
    telegramBot: Object.keys(telegramBot).length > 0 ? telegramBot : null,
    telegramGroupId: -523868176,
    walletSigs: walletSigs,
    contractAddress: "0xcC099752238b1932587bf5793Afeb7d80D04F6e1".toLowerCase(),
    multisigAddress: "0x1D67BDA1144CacDbEFF1782f0E5B43D7B50bbFe0".toLowerCase(),
    account: accounts["test"],
    node: node.test,
    thresholdConfirmations: 1
}