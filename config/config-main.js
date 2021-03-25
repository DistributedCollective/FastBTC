import telegramBot from '../secrets/telegram';
import walletSigs from "../secrets/walletSigs.main";
import node from '../secrets/btcNode';
import accounts from "../secrets/accounts";
import slaves from '../secrets/slaves';

export default {
    env: "prod",
    serverPort: 3000,
    appName: "FastBtcV3",
    dbName: "fastbtcv3_main",
    rskNode: "https://mainnet.sovryn.app/rpc",
    blockExplorer: "https://explorer.rsk.co",
    commission: 5000, //in sats
    minAmount: 40000, //sats, = 0.0002 btc
    maxAmount: 100000000, //sats, = 1 btc
    telegramBot: Object.keys(telegramBot).length > 0 ? telegramBot : null,
    telegramGroupId: -1001469142339,
    walletSigs: walletSigs,
    slaves: slaves.main,
    contractAddress: "0xca1C5B1bc55755C5e3b6Ed1afE88ABD7B26F147f".toLowerCase(),
    multisigAddress: "0x0f279e810B95E0d425622b9b40D7bCD0B5C4B19d".toLowerCase(),
    account: accounts["main"],
    node: node.main,
    thresholdConfirmations: 1
}
