/**
 * Slaves (confirmation nodes) controller. Authenticate the slaves and returns Btc node credentials as well as Btc deposit payment information
 */

import dbCtrl from './dbCtrl';
import rskCtrl from './rskCtrl';
import conf from '../config/config';
import Web3 from 'web3';
import Util from '../utils/helper';
import mainCtrl from './mainCtrl';

class SlaveCtrl {
    constructor() {
        // a cosigner is the slave node watching for withdraw requests that need confirmation
        this.cosignersArray = [];
        this.web3 = new Web3(conf.rskNode);
    }

    async start(app) {
        app.post('/getNode', this.authenticate.bind(this), async (req, res) => this.returnNode(res));
        app.post('/getCosignerIndexAndDelay', this.authenticate.bind(this), (req, res) => this.addCosigner(req, res));
        app.post('/getUnsignedDepositAddresses', this.authenticate.bind(this), (req, res) => this.getUnsignedDepositAddresses(req, res));
        app.post('/getPayment', this.authenticate.bind(this), async (req, res) => await this.returnPayment(req, res));
        app.post('/addAddressMappingSignature', this.authenticate.bind(this), async (req, res) => await this.addAddressMappingSignature(req, res));
    }

    authenticate(req, res, next) {
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (ip) {
            console.log('got connection from ', ip);
        }

        if (!req.body.message) {
            console.error("slave: message is missing");
            return res.status(403).json({error: "Message is missing"});
        }

        if (!req.body.message.startsWith("Hi master")) {
            console.error("slave: invalid message");
            return res.status(403).json({error: "Invalid message"});
        }

        if (!req.body.signedMessage) {
            console.error("slave: signature missing");
            return res.status(403).json({error: "Signature is missing"});
        }

        if (!req.body.walletAddress) {
            console.error("slave: wallet address missing");
            return res.status(403).json({error: "Wallet address is missing"});
        }

        if (conf.slaves.indexOf(req.body.walletAddress.toLowerCase()) === -1) {
            console.error("slave: not authorized wallet address");
            return res.status(403).json({error: "You are not allowed to access this service"});
        }

        const signatureVerified = this.verifySignature(
            req.body.message,
            req.body.signedMessage,
            req.body.walletAddress,
        );

        if (!signatureVerified) {
            console.error("slave: invalid signature");
            return res.status(403).json({Error: "Error verifying signature"});
        }

        next();
    }

    verifySignature(msg, signature, address) {
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

    async getUnsignedDepositAddresses(req, res) {
        const from = req.body.walletAddress;

        const response = await dbCtrl.getUnsignedDepositAddresses(from);

        res.status(200).json({
            addresses: response.map((e) => { return {
                btcAddress: e.btcadr,
                web3Address: e.web3adr,
            }})
        });
    }

    async addAddressMappingSignature(req, res) {
        const from = req.body.walletAddress;
        const signature = req.body.signature;
        const web3Address = req.body.web3Address;
        const btcAddress = req.body.btcAddress;

        const user = await dbCtrl.getUserByBtcAddress(req.body.btcAddress);
        if (! user) {
            res.status(404).json({error: "Deposit address not found"});
            return;
        }
        if (user.web3adr !== web3Address) {
            res.status(403).json({error: "Wrong rsk address for deposit address"});
            return;
        }

        if (! await mainCtrl.verifyDepositAddressSignature(btcAddress, web3Address, from, signature)) {
            res.status(400).json({error: "Invalid signature!"});
        }

        await dbCtrl.depositAddressSignatureRepository.insert({
            deposit_address_id: user.id,
            signer: from,
            signature: signature,
            created: new Date(),
        });

        res.status(200).json({
            success: true
        });
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
        const txId = req.body.txId;
        console.log("Return btc address for txId %d", txId);
        console.log(req.body)

        let retries = 0;

        // dirty quickfix for payment undefined response from db
        while (true) {
            let response;
            try {
                response = await dbCtrl.getPaymentInfo(txId);
            }
            catch (e) {
                console.log("error getting payment info for txId %d", txId)
                console.log(e);
                response = {};
            }
            const {btcAdr, txHash, vout, web3Adr, signatures} = response;

            // vout can be zero!!!
            if (!btcAdr || !txHash || vout == null) {
                return res.status(403).json("Error retrieving user payment info");
            }

            return res.status(200).json({
                btcAdr,
                txHash,
                vout,
                web3Adr,
                signatures,
            });
        }
    }

    async getCosignersBalances() {
        return Promise.all(this.cosignersArray.map(async cosignerAddress => {
            return await rskCtrl.getBalance(cosignerAddress);
        }));
    }
}


export default new SlaveCtrl();
