/**
 * Transfers rBtc from the given wallet to user addresses 
 */
import Web3 from 'web3';
import helper from "../utils/helper";
import contractAbi from "../config/contractAbi";
import conf from '../config/config';

class RskCtrl {
    init() {
        this.web3 = new Web3(conf.rskNode);
        this.from = conf.account.adr;
        this.max = conf.maxAmountInUsd;
        this.min = conf.minAmount;
        this.lastPrice=0;
        this.web3.eth.accounts.wallet.add(conf.account.pKey);
        this.contract = new this.web3.eth.Contract(contractAbi, conf.contractAddress);
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
     */
    async sendRbtc(amount, to) {
        console.log("Trying to send "+amount +" to: "+to);
        const btcPrice = await helper.getBTCPrice();
        if(!btcPrice.error) this.lastPrice=btcPrice;

        console.log("Current Btc price "+this.lastPrice);
        let transferValueSatoshi = Number(amount) - conf.commission;
        transferValueSatoshi = Number(Math.max(transferValueSatoshi, 0).toFixed(0));

        const bal = await this.getBalanceSats(conf.contractAddress);
        if (bal < amount) {
            console.error("Not enough balance left on the wallet "+this.from+" bal = "+bal);
            return { "error": "Not enough balance left. Please contact the admin support@sovryn.app" };
        }

        const maxAmount = (this.max+conf.toleranceMax) * 1e8 / this.lastPrice;

        if (transferValueSatoshi > maxAmount || transferValueSatoshi < conf.toleranceMin) {
            console.error(new Date(Date.now())+ "Transfer amount outside limit");
            console.error("Max amount: "+maxAmount+" transferValue: "+transferValueSatoshi+ ", max: "+this.max+", min: "+this.min);
            return { "error": "Your transferred amount exceeded the limit. Please send between " + (maxAmount/1e8) + " and " + (this.min/1e8) + " Btc. Contact the admin: support@sovryn.app " };
        }

        const transferValue = (transferValueSatoshi/1e8).toString();
        const weiAmount = this.web3.utils.toWei(transferValue, 'ether');

        const receipt = await this.transfer(weiAmount, to);
        
        if (receipt.transactionHash) {
            console.log("Successfully transferred "+amount+" to "+to);
            return {
              txHash: receipt.transactionHash,
              value: transferValue
            };
        }
        else {
            console.error("Error sending " + amount + " to: " + to);
            console.error(receipt);
            return { "error": "Error sending rsk. Please contact the admin support@sovryn.app." };
        }
    }

    async transfer(val, to){
        const receipt = await this.contract.methods.withdrawAdmin(to.toLowerCase(), val).send({
            from: this.from,
            gas: 100000
        });
        return receipt;
    }
}

export default new RskCtrl();
