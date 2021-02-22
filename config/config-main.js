import telegramBot from '../secrets/telegram';
import walletSigs from "../secrets/walletSigs.main";
import node from '../secrets/btcNode';
import accounts from "../secrets/accounts";


export default {
    env: "prod", 
    serverPort: 3007,
    appName: "FastBtcV3",
    dbName: "fastbtcv3_main",
    rskNode: "https://mainnet.sovryn.app/rpc",
    commission: 10000, //in sats
    minAmount: 100000, //sats, = 0.001 btc
    maxAmount: 1000000, //sats, = 0.1 btc
    telegramBot: Object.keys(telegramBot).length > 0 ? telegramBot : null,
    telegramGroupId: -1001308978723,
    walletSigs: walletSigs,
    contractAddress: "0xca1C5B1bc55755C5e3b6Ed1afE88ABD7B26F147f".toLowerCase(),
    multisigAddress: "0x1D67BDA1144CacDbEFF1782f0E5B43D7B50bbFe0".toLowerCase(),
    account: accounts["main"],
    node: node.main,
    thresholdConfirmations: 1
}