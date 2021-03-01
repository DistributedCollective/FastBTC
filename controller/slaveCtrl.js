import dbCtrl from './dbCtrl';
import conf from '../config/config';
import Web3 from 'web3';

class SlaveCtrl {
    constructor() {
        // a cosigner is the slave node watching for withdraw requests that need confirmation
        this.cosignersArray = [];
        this.web3 = new Web3(conf.rskNode);
    }

    async start(app) {
        await dbCtrl.initDb(conf.dbName);

        app.post('/getNode', this.authenticate.bind(this), async (req, res)=> this.returnNode(res));
        app.post('/getCosignerIndexAndDelay', this.authenticate.bind(this), (req,res) => this.addCosigner(req,res));
        app.post('/getBtcAdr', this.authenticate.bind(this), async (req, res)=> await this.returnBtcAdr(req, res));
    }


    authenticate(req, res, next) {
        console.log("new authentication request");
        console.log(req.body);

        if (!req.body.message || req.body.message == "") return res.status(403).json({ error: "Message is missing" });
        if (!req.body.signedMessage || req.body.signedMessage == "") return res.status(403).json({ error: "Signature is missing" });
        if (!req.body.walletAddress || req.body.walletAddress == "") return res.status(403).json({ error: "Wallet address is missing" });

        if (conf.slaves.indexOf(req.body.walletAddress) === -1) {
            return res.status(403).json({ error: "You are not allowed to access this service" });
        }

        const updateAllowed = this.verifySignature(req.body.message, req.body.signedMessage, req.body.walletAddress);
        if (!updateAllowed) return res.status(403).json({ Error: "Error verifying signature" });

        next();
    }

    verifySignature(msg, signature, address) {
        console.log("verify signature");
        const p = this;
        try {
            return this.web3.eth.accounts.recover(msg, signature).toLowerCase() == address.toLowerCase();
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
        if(this.cosignersArray.indexOf(req.body.walletAddress)==-1) this.cosignersArray.push(req.body.walletAddress);
        res.status(200).json({ index: this.cosignersArray.length - 1, delay: 2 * (this.cosignersArray.length - 1) });
    }

    removeCosigner(socket) {
        console.log("Removing cosigner");
        this.cosignersArray = this.cosignersArray.filter(index => index !== socket.id);
    }

    async returnBtcAdr(req, res) {
        const { btcAdr, txHash} = await dbCtrl.getUserBtcAdrAndTxHashByTxId(req.body.txId)
        res.status(200).json({btcAdr, txHash});
    }

}


export default new SlaveCtrl();