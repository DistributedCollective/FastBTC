/**
* Relays Btc to Rbtc. 
*/
import { SSL_OP_CRYPTOPRO_TLSEXT_BUG } from 'constants';
import conf from './config/config';
const express= require('express');
const app = express();
const http = require('http').createServer(app);
import MainCtrl from './controller/mainCtrl';
import SlaveCtrl from './controller/slaveCtrl';


console.log("Hola. Starting the Fast-Btc-relay on "+conf.env);
       
app.use('/', express.static('dist'));


http.listen(conf.serverPort, () => {
    console.log('listening on *:'+conf.serverPort);
});


MainCtrl.start(http);
SlaveCtrl.start(app);