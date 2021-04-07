/**
 * Slaves (confirmation nodes) controller. Authenticate the slaves and returns Btc node credentials as well as Btc deposit payment information
 */

import dbCtrl from './dbCtrl';
import conf from '../config/config';
import Web3 from 'web3';
import Util from '../utils/helper';

class SlaveCtrl {
    constructor() {
        // a cosigner is the slave node watching for withdraw requests that need confirmation
        this.cosignersArray = [];
        this.web3 = new Web3(conf.rskNode);
    }

    async start(app) {
        app.post('/getNode', this.authenticate.bind(this), async (req, res)=> this.returnNode(res));
        app.post('/getCosignerIndexAndDelay', this.authenticate.bind(this), (req,res) => this.addCosigner(req,res));
        app.post('/getPayment', this.authenticate.bind(this), async (req, res)=> await this.returnPayment(req, res));
    }

    authenticate(req, res, next) {
        console.log("new authentication request", req.body);
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (ip) console.log('remote address', ip); // ip address of the confirmation-node

        if (!req.body.message) return res.status(403).json({ error: "Message is missing" });
        if (!req.body.signedMessage) return res.status(403).json({ error: "Signature is missing" });
        if (!req.body.walletAddress) return res.status(403).json({ error: "Wallet address is missing" });

        if (conf.slaves.indexOf(req.body.walletAddress.toLowerCase()) === -1) {
            return res.status(403).json({ error: "You are not allowed to access this service" });
        }

        const updateAllowed = this.verifySignature(req.body.message, req.body.signedMessage, req.body.walletAddress);
        if (!updateAllowed) return res.status(403).json({ Error: "Error verifying signature" });

        next();
    }

    verifySignature(msg, signature, address) {
        console.log("verify signature");
        try {
            return this.web3.eth.accounts.recover(msg, signature).toLowerCase() === address.toLowerCase();
        } catch (e) {
            console.error("Error recovering message");
            console.error(e);
            return false;
        }
    }

    returnNode(res){
        res.status(200).json(conf.node);
    }


    addCosigner(req, res) {
        console.log("Adding cosigner");
        if (this.cosignersArray.indexOf(req.body.walletAddress) === -1) {
            this.cosignersArray.push(req.body.walletAddress);
        }

        const delay = Math.floor(this.cosignersArray.length / 2) * 60;
        res.status(200).json({ index: this.cosignersArray.length - 1, delay: delay });
    }

    removeCosigner(socket) {
        console.log("Removing cosigner");
        this.cosignersArray = this.cosignersArray.filter(index => index !== socket.id);
    }

    async returnPayment(req, res) {
        console.log("Return btc address");
        console.log(req.body)
        let cnt=0;

        //dirty quickfix for payment undefined response from db
        while(true) {
            const { btcAdr, txHash} = await dbCtrl.getPaymentInfo(req.body.txId);
            if(!btcAdr || !txHash) {
                console.error("Error retrieving user payment info. "+cnt+" attempt");
                cnt++;

                if(cnt==5) return res.status(403).json("Error retrieving user payment info");
                else {
                    Util.wasteTime(1);
                    continue;
                }
            }
            return res.status(200).json({btcAdr, txHash});  
        }
    }
}  


export default new SlaveCtrl();
