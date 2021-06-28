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
        return {
            "types": MESSAGE_TYPES,
            "primaryType": "DepositAddressMapping",
            "domain": {
                "name": "Sovryn FastBTC Bridge",
                "version": "1",
                "chainId": await rskCtrl.web3.eth.getChainId(),
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
