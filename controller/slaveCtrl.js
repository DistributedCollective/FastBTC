/**
 * Slaves (confirmation nodes) controller. Authenticate the slaves and returns Btc node credentials as well as Btc deposit payment information
 */

import dbCtrl from './dbCtrl';
import rskCtrl from './rskCtrl';
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
        app.post('/getNode', this.authenticate.bind(this), async (req, res) => this.returnNode(res));
        app.post('/getCosignerIndexAndDelay', this.authenticate.bind(this), (req, res) => this.addCosigner(req, res));
        app.post('/getPayment', this.authenticate.bind(this), async (req, res) => await this.returnPayment(req, res));
    }

    authenticate(req, res, next) {
        console.log("new authentication request", req.body);
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (ip) {
            console.log('remote address', ip);
        }

        if (!req.body.message) {
            return res.status(403).json({error: "Message is missing"});
        }

        if (!req.body.message.startsWith("Hi master")) {
            return res.status(403).json({error: "Invalid message"});
        }

        if (!req.body.signedMessage) {
            return res.status(403).json({error: "Signature is missing"});
        }

        if (!req.body.walletAddress) {
            return res.status(403).json({error: "Wallet address is missing"});
        }

        if (conf.slaves.indexOf(req.body.walletAddress.toLowerCase()) === -1) {
            return res.status(403).json({error: "You are not allowed to access this service"});
        }

        const signatureVerified = this.verifySignature(
            req.body.message,
            req.body.signedMessage,
            req.body.walletAddress,
        );

        if (!signatureVerified) {
            return res.status(403).json({Error: "Error verifying signature"});
        }

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

    returnNode(res) {
        res.status(200).json(conf.node);
    }

    addCosigner(req, res) {
        console.log("Adding cosigner: %s", req.body.walletAddress);

        if (this.cosignersArray.indexOf(req.body.walletAddress) === -1) {
            this.cosignersArray.push(req.body.walletAddress);
        }

        const index = this.cosignersArray.indexOf(req.body.walletAddress);
        const delay = Math.floor(index / 2) * 60;

        res.status(200).json({
            index: index,
            delay: delay,
        });
    }

    // this is not actually ever called
    // removeCosigner(socket) {
    //     console.log("Removing cosigner");
    //     this.cosignersArray = this.cosignersArray.filter(index => index !== socket.id);
    // }

    async returnPayment(req, res) {
        console.log("Return btc address");
        console.log(req.body)
        let cnt = 0;

        // dirty quickfix for payment undefined response from db
        while (true) {
            let response;
            try {
                response = await dbCtrl.getPaymentInfo(req.body.txId);
            }
            catch (e) {
                console.log("error getting payment info")
                console.log(e);
                response = {};
            }
            const {btcAdr, txHash, vout} = response;

            // vout can be zero!!!
            if (!btcAdr || !txHash || vout == null) {
                cnt++;
                console.error("Error retrieving user payment info. %d attempt", cnt);

                if (cnt === 5) {
                    return res.status(403).json("Error retrieving user payment info");
                }
                else {
                    await Util.wasteTime(1);
                    continue;
                }
            }
            return res.status(200).json({btcAdr, txHash, vout});
        }
    }

    async getCosignersBalances() {
        return Promise.all(this.cosignersArray.map(async cosignerAddress => {
            return await rskCtrl.getBalance(cosignerAddress);
        }))
    }
}


export default new SlaveCtrl();
