/**
 * App 
 */

 
const { origin, pathname } = new URL('http://3.129.31.108:3007');
console.log(origin);
console.log(pathname)


const socket = io(origin, {
    reconnectionDelayMax: 10000,
    path: pathname && pathname !== '/' ? pathname : '',
})

var qr = require('qr-encode');
const conf = require('../config/config');


class AppCtrl {
    constructor ($scope, $timeout) {
        const timer = setInterval(() => {
            if (window.web3Initialized) {
                clearInterval(timer);
                if (window.ethEnabled) {
                    console.log("Main started");
                    this.start();
                } else {
                    this.showError("Please install MetaMask to use this app");
                }
            }
        }, 50);

        this.$scope = $scope;
        this.$timeout = $timeout;

        this.showLoading = true;
        this.amountInfo = {
            min: 0.001,
            max: 0.002
        };
      
        this.error = false;
        this.rskExplorer = conf.env === "prod" ? "https://explorer.rsk.co" : "https://explorer.testnet.rsk.co"; 
        this.bitcoinExplorer = conf.env === "prod" ? "https://live.blockcypher.com/btc" : "https://live.blockcypher.com/btc-testnet"; 
    }

    static get $inject() {
        return ['$scope', '$timeout'];
    }

    start() {
        let adr = window.acc;
        this.address = adr;

        this.showLoading = true;
        socket.emit("getDepositAddress", adr, (err, res) => {
            console.log("response");
            console.log(res);

            if (res && res.btcadr) {
                this.showUserInfo(res);
            } else {
                this.showError(err && err.error || "Something's wrong. Please try again!")
            }

            this.$scope.$apply();
        });

        socket.emit('txAmount', (info) => this.showTxAmountInfo(info));

        socket.on('depositTx', (tx) => {
            this.depositTx = tx;
            this.$scope.$apply();
        });

        socket.on('transferTx', (tx) => {
            this.transferTx = tx;
            this.$scope.$apply();
        });

        socket.on('depositError', (msg) => {
            this.showError("Deposit error: " + msg);
        });

        socket.on('txAmount', (info) => this.showTxAmountInfo(info));

    }

    showMessage(msg, isError = true) {
        this.$timeout(() => {
            this.error = isError;
            this.message = msg;
            this.showLoading = false;
        });
    }

    showError(msg) {
        this.error = msg;
        this.showLoading = false;
    }

    showUserInfo(user) {
        this.user = user;
        this.showLoading = false;
        this.initQRCode(user.btcadr);
    }

    initQRCode(btcAddress) {
        console.log("init qr code");
        this.$timeout(() => {
            var dataURI = qr(btcAddress, {type: 6, size: 6, level: 'Q'})
            //If using in browsers:
            var img = new Image()
            img.src = dataURI
            document.getElementById('qrCode').appendChild(img)

        }, 50);
    }
   
    showTxAmountInfo(amount) {
        if (amount && amount.min != null && amount.max != null) {
            this.amountInfo = amount;
            this.$scope.$apply();
        }
    }


}

angular.module('app', [])
    .controller('appCtrl', AppCtrl);

angular.bootstrap(document, ['app']);
