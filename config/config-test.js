import telegramBot from '../secrets/telegram';
import walletSigs from "../secrets/walletSigs.test";
import node from '../secrets/btcNode';
import accounts from "../secrets/accounts";
import slaves from '../secrets/slaves';

export default {
    env: "test",
    serverPort: 3007,
    backendUrl: "http://3.129.31.108:3007/",
    appName: "FastBtcV3",
    dbName: "fastbtcv3_test",
    rskNode: "https://testnet.sovryn.app/rpc",
    blockExplorer: "https://explorer.testnet.rsk.co",
    commission: 500, //in sats
    minAmount: 10000, //sats, = 0.001 btc
    maxAmount: 1000000, //sats, = 0.1 btc
    balanceThreshold: 0.05, //in rbtc
    telegramBot: Object.keys(telegramBot).length > 0 ? telegramBot : null,
    telegramGroupId: -523868176,
    walletSigs: walletSigs,
    slaves: slaves.test,
    contractAddress: "0xcC099752238b1932587bf5793Afeb7d80D04F6e1".toLowerCase(),
    multisigAddress: "0x1D67BDA1144CacDbEFF1782f0E5B43D7B50bbFe0".toLowerCase(),
    account: accounts["test"],
    node: node.test,
    thresholdConfirmations: 1,
    startIndex: 175, //multisig tx-index from which the node starts confirming withdraw requests 
    maxConfirmationsToTrack: 6,
};
