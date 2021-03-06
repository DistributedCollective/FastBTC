/**
 * Transfers rBtc from the given wallet to user addresses 
 */
import Web3 from 'web3';
import helper from "../utils/helper";
import managedWalletAbi from "../config/contractAbi";
import multisigAbi from '../config/multisigAbi';
import conf from '../config/config';
import { Mutex } from 'async-mutex';
import walletManager from './walletCtrl';
import U from '../utils/helper';

class RskCtrl {
    init() {
        this.web3 = new Web3(conf.rskNode);
        this.from = conf.account.adr;
        this.max = conf.maxAmount;
        this.min = conf.minAmount;
        this.mutex = new Mutex();
        this.contract = new this.web3.eth.Contract(managedWalletAbi, conf.contractAddress);
        this.multisig = new this.web3.eth.Contract(multisigAbi, conf.multisigAddress);
        walletManager.init(this.web3);
    }

    async getBalanceSats(adr) {
        const balWei = await this.web3.eth.getBalance(adr);
        const balBtc = this.web3.utils.fromWei(balWei, 'ether');
        return Number(balBtc) * 1e8;
    }

    /**
     *
     * @param amount - in satoshi
     * @param to
     * @returns {Promise<{error: string}|{value: number, txHash: string}>}
     * todo: fix min/max amount update
     */
    async sendRbtc(amount, to) {
        console.log("Trying to send " + amount + " to: " + to);
       
        let transferValueSatoshi = Number(amount) - conf.commission;
        transferValueSatoshi = Number(Math.max(transferValueSatoshi, 0).toFixed(0));
        console.log("transferValueSatoshi "+transferValueSatoshi)
        const bal = await this.getBalanceSats(conf.contractAddress);
        if (bal < amount) {
            console.error("Not enough balance left on the wallet " + this.from + " bal = " + bal);
            return { "error": "Not enough balance left. Please contact the admin support@sovryn.app" };
        }

        if (transferValueSatoshi > conf.maxAmount || transferValueSatoshi <= conf.minAmount) {
            console.error(new Date(Date.now()) + "Transfer amount outside limit");
            console.error("transferValue: " + transferValueSatoshi);
            return { "error": "Your transferred amount exceeded the limit." };
        }

        const transferValue = (transferValueSatoshi / 1e8).toString();
        console.log("transfer value "+transferValue)
        const weiAmount = this.web3.utils.toWei(transferValue, 'ether');
        console.log("wei amount "+weiAmount)

        const receipt = await this.transferFromMultisig(weiAmount, to);
        let txId;
        
        if (receipt && receipt.events.Submission) {
            const hexTransactionId = receipt.events.Submission.raw.topics[1];
            txId = this.web3.utils.hexToNumber(hexTransactionId);
        }

        if (receipt.transactionHash) {
            console.log("Successfully transferred " + amount + " to " + to);
            return {
                txHash: receipt.transactionHash,
                txId,
                value: transferValue
            };
        }
        else {
            console.error("Error sending " + amount + " to: " + to);
            console.error(receipt);
            return { "error": "Error sending rsk. Please contact the admin support@sovryn.app." };
        }
    }

    async transferFromMultisig(val, to) {
        console.log("transfer " + val + " to " + to)
        const wallet = await this.getWallet();
        if (wallet.length == 0) return { error: "no wallet available to process the assignment" };
        const nonce = await this.web3.eth.getTransactionCount(wallet, 'pending');
        const gasPrice = await this.getGasPrice();
        const data = this.web3.eth.abi.encodeFunctionCall({
            name: 'withdrawAdmin',
            type: 'function',
            inputs: [{ "name": "receiver", "type": "address" }, { "name": "amount", "type": "uint256" }]
        }, [to, val]);

        const receipt = await this.multisig.methods.submitTransaction(conf.contractAddress, 0, data).send({
            from: wallet,
            gas: 1000000,
            gasPrice: gasPrice,
            nonce: nonce
        });

        walletManager.decreasePending(wallet);
        return receipt;
    }



    /**
     * @notice loads a free wallet from the wallet manager 
     * @dev this is secured by a mutex to make sure we're never exceeding 4 pending transactions per wallet
     */
    async getWallet() {
        await this.mutex.acquire();
        let wallet = "";
        let timeout = 5 * 60 * 1000;
        try {
            //if I have to wait, any other thread needs to wait as well
            wallet = await walletManager.getFreeWallet(timeout);
            //because the node can't handle too many simultaneous requests
            await U.wasteTime(0.5);
            this.mutex.release();
        }
        catch (e) {
            this.mutex.release();
            console.error(e);
        }
        return wallet;
    }

    async getGasPrice() {
        const gasPrice = await this.web3.eth.getGasPrice();
        return Math.round(gasPrice);
    }
}

export default new RskCtrl();
