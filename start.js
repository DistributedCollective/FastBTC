/**
* Relays Btc to Rbtc. 
*/
const express= require('express');
const app = express();
const http = require('http').createServer(app);
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

import conf from './config/config';
import MainCtrl from './controller/mainCtrl';
import SlaveCtrl from './controller/slaveCtrl';


console.log("Hola. Starting the Fast-Btc-relay on "+conf.env);
       
app.use('/', express.static('dist'));


http.listen(conf.serverPort, () => {
    console.log('listening on *:'+conf.serverPort);
});


MainCtrl.start(http);
SlaveCtrl.start(app);