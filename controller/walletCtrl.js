/**
 * Manages the wallets.
 */
import conf from '../config/config';
import U from '../utils/helper';

class WalletManager {
    /**
     * initiates the wallet list and imports the private key
     * @param {*} web3 the web3 instance used by zhe rskCtrl
     */
    init(web3){
        this.wallet={};
        const pKey = web3.eth.accounts.decrypt(conf.account.ks, process.argv[3]).privateKey;
        web3.eth.accounts.wallet.add(pKey);
        this.wallet = {
            address: conf.account.adr,
            pending: 0
        };
    }
    
    /**
     * returns a wallet with less than 4 pending transactions
     * @param {*} timeout the maximum waiting time  in ms
     */
    async getFreeWallet(timeout){
        const stopAt = Date.now() + timeout;
        while (Date.now() < stopAt){
            if(this.wallet.pending < 4){
                this.wallet.pending++;
                return this.wallet.address;
            }
            await U.wasteTime(5);
        }
        return "";
    }

    
    /**
     * decreases the pending tx count for a wallet
     * @param {*} wallet 
     */
    decreasePending(walletAddress){
        if(this.wallet.address == walletAddress){
            this.wallet.pending--;
            return true;
        }
        
        console.error("could not decrease the pending tx count for non-existing wallet address: "+walletAddress);
        return false;
    }

}

export default new WalletManager();