import telegramBot from '../secrets/telegram';
import walletSigs from '../secrets/walletSigs.main';
import node from '../secrets/btcNode';
import accounts from '../secrets/accounts';
import slaves from '../secrets/slaves';

export default {
    env: 'prod',
    serverPort: 3000,
    backendUrl: 'http://3.131.33.161:3000',
    appName: 'FastBtcV3',
    dbName: 'fastbtcv3_main',
    rskNode: 'https://mainnet.sovryn.app/rpc',
    blockExplorer: 'https://explorer.rsk.co',
    commission: 5000, //in sats
    minAmount: 40000, //sats, = 0.0002 btc
    maxAmount: 100000000, //sats, = 1 btc
    balanceThreshold: 0.05, //in rbtc
    telegramBot: Object.keys(telegramBot).length > 0 ? telegramBot : null,
    telegramGroupId: -1001469142339,
    walletSigs: walletSigs,
    slaves: slaves.main,
    contractAddress: '0xC9e14126E5796e999890a4344b8e4c99Ac7002A1'.toLowerCase(),
    bscBridgeAddress: '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350'.toLowerCase(),
    bscAggregatorAddress: '0x1dA3D286a3aBeaDb2b7677c99730D725aF58e39D'.toLowerCase(),  // BSC network BTCs aggregator.
    multisigAddress: '0x0f279e810B95E0d425622b9b40D7bCD0B5C4B19d'.toLowerCase(),
    bscPrefix: 'bsc:',
    account: accounts['main'],
    node: node.main,
    thresholdConfirmations: 1,
    startIndex: 9000, //multisig tx-index from which the node starts confirming withdraw requests
    maxConfirmationsToTrack: 6,
};
