import Web3 from 'web3';
import conf from '../config/config';
var web3 = new Web3(conf.nodeProvider);


const account = conf.account;
const ks = web3.eth.accounts.encrypt(account.pKey, "pass");
console.log(ks);


//let r = web3.eth.accounts.decrypt(ks, p);
//console.log(r);
