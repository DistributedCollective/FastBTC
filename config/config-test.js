import telegramBot from '../secrets/telegram';
import walletSigs from "../secrets/walletSigs.test";
import node from '../secrets/btcNode';
import accounts from "../secrets/accounts";
import slaves from '../secrets/slaves';

export default {
    env: "test",
    serverPort: 3007,
    backendUrl: "http://3.132.40.118:3007/",
    appName: "FastBtcV3",
    dbName: "fastbtcv3_test",
    rskNode: "https://testnet.sovryn.app/rpc",
    blockExplorer: "https://explorer.testnet.rsk.co",
    commission: 500, //in sats
    minAmount: 2000, //sats, = 0.00002 btc
    maxAmount: 1000000, //sats, = 0.01000000 btc
    balanceThreshold: 0.05, //in rbtc
    telegramBot: Object.keys(telegramBot).length > 0 ? telegramBot : null,
    telegramGroupId: -523868176,
    walletSigs: walletSigs,
    slaves: slaves.test,

    multisigAddress: "0x1D67BDA1144CacDbEFF1782f0E5B43D7B50bbFe0".toLowerCase(),
    contractAddress: "0x8dC7B212692b3E36aF7E8202F06516d0dB3Bf1B6".toLowerCase(),
    bscBridgeAddress: "0x2b2bcad081fa773dc655361d1bb30577caa556f8".toLowerCase(),
    bscAggregatorAddress: "0x63f9a9145147330dFAdc991CC3821DF23879ae16".toLowerCase(),

    // old: bscAggregatorAddress: "0xe2C2fbAa4407fa8BB0Dbb7a6a32aD36f8bA484aE".toLowerCase(),
    bscPrefix: 'bsctest:',

    account: accounts["test"],
    node: node.test,
    thresholdConfirmations: 1,
    startIndex: 175, //multisig tx-index from which the node starts confirming withdraw requests 
    maxConfirmationsToTrack: 6,
};
