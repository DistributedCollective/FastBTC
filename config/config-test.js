import telegramBot from '../secrets/telegram';
import walletSigs from "../secrets/walletSigs.test";
import node from '../secrets/btcNode';
import accounts from "../secrets/accounts";
import slaves from '../secrets/slaves';

export default {
    env: "test",
    serverPort: 3007,
    backendUrl: "http://localhost:3007",
    appName: "FastBtcV3",
    dbName: "fastbtcv3_test",
    rskNode: "https://testnet.sovryn.app/rpc",
    blockExplorer: "https://explorer.testnet.rsk.co",
    commission: 500, //in sats
    minAmount: 10000, //sats, = 0.001 btc
    maxAmount: 1000000, //sats, = 0.1 btc
    telegramBot: Object.keys(telegramBot).length > 0 ? telegramBot : null,
    telegramGroupId: -386620635,
    walletSigs: walletSigs,
    slaves: slaves.test,
    contractAddress: "0x79c911A067705A8F43c693d93B42615a25e839d8".toLowerCase(),
    multisigAddress: "0x369706822FAcb3441853C9c405EAb1a2d5c76664".toLowerCase(),
    account: accounts["test"],
    node: node.test,
    thresholdConfirmations: 1,
    maxConfirmationsToTrack: 6,
};
