/**
* Relays Btc to Rbtc. 
*/
import conf from './config/config';
const express= require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { serveClient: false });
import MainController from './controller/mainCtrl';
const mCtrl = new MainController();
import apiKey from './secrets/apiKey';



console.log("Hola. Starting the Fast-Btc-relay on "+conf.env);
       
app.use('/', express.static('dist'));


const checkAPIKey = (req, res, next) => {
    const auth = req.get('authorization');
   
    if (auth && auth === apiKey) next();
    else {
        console.error("Bad access attempt");
        res.status(403).send("Not allowed");
    }
};

app.get('/getDb', checkAPIKey, (req, res) => {
    console.log("New download db request");
    res.sendFile('/home/ubuntu/Fast-BTC/db/'+conf.dbName+".db", (err) => {
      res.end();
      if (err) throw(err);
    });
});

http.listen(conf.serverPort, () => {
    console.log('listening on *:'+conf.serverPort);
});

io.on('connection', (socket) => { 
    console.info("A client connected")
    socket.emit('client-connected', { text: 'A client connected!' }) 
});

mCtrl.start(http);