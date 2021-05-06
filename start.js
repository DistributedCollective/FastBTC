/**
 * Relays Btc to Rbtc.
 */

require('log-timestamp');

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

import conf from './config/config';
import MainCtrl from './controller/mainCtrl';
import SlaveCtrl from './controller/slaveCtrl';

const frontendConfig = {
    backendUrl: conf.backendUrl,
    env: conf.env,
};

const frontendConfigJson = JSON.stringify(frontendConfig);


console.log("Hola. Starting the Fast-Btc-relay on " + conf.env);

app.get('/config.js', (req, res) => {
    res.set({ 'Content-Type': 'application/javascript' });

    res.send(`window.FASTBTC_CONFIG = ${frontendConfigJson};`);
});

app.use('/', express.static('dist'));

http.listen(conf.serverPort, () => {
    console.log('listening on *:' + conf.serverPort);
});


MainCtrl.start(http);
SlaveCtrl.start(app);
