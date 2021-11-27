import { TypedDataUtils } from 'ethers-eip712'
import conf from '../config/config';
import rskCtrl from '../controller/rskCtrl';
import walletCtrl from '../controller/walletCtrl';
import {ethers} from 'ethers';

const MESSAGE_TYPES = {
    "EIP712Domain": [
        {"name": "name", "type": "string"},
        {"name": "version", "type": "string"},
        {"name": "chainId", "type": "uint256"},
        {"name": "verifyingContract", "type": "address"},
    ],
    "DepositAddressMapping": [
        {"name": "btcDepositAddress", "type": "string"},
        {"name": "rskTargetAddress", "type": "address"},
    ]
};

export default class AddressMappingSigner {
    async createTemplateForMapping(btcAddress, web3Address) {
        const rskChainId = await rskCtrl.web3.eth.getChainId();
        let targetChainId = rskChainId;
        if (web3Address.startsWith('bsc:')) {
            // binance mainnet
            targetChainId = 0x38;
            if (rskChainId !== 30) {
                throw new Error("Trying to target BSC mainnet with RSK testnet?");
            }
            web3Address = web3Address.replace('bsct:', '');
        }
        else if (web3Address.startsWith('bsctest:')) {
            targetChainId = 0x61;
            if (rskChainId !== 31) {
                throw new Error("Trying to target BSC testnet with RSK mainnet?");
            }
            web3Address = web3Address.replace('bsctest:', '');
        }

        return {
            "types": MESSAGE_TYPES,
            "primaryType": "DepositAddressMapping",
            "domain": {
                "name": "Sovryn FastBTC Bridge",
                "version": "1",
                "chainId": targetChainId,
                "verifyingContract": conf.multisigAddress.toLowerCase(),
            },
            "message": {
                "btcDepositAddress": btcAddress,
                "rskTargetAddress": web3Address.toLowerCase(),
            }
        };
    }

    async getSigningAddress(btcAddress, web3Address, signature) {
        signature = ethers.utils.splitSignature(signature);
        const message = await this.createTemplateForMapping(btcAddress, web3Address);
        const digest = TypedDataUtils.encodeDigest(message);
        return ethers.utils.recoverAddress(digest, signature).toLowerCase();
    }

    async signAddressMapping(btcAddress, web3Address) {
        const message = await this.createTemplateForMapping(btcAddress, web3Address);
        const digest = TypedDataUtils.encodeDigest(message);
        return walletCtrl.signDigest(digest);
    }
}
