

const { origin, pathname } = new URL('https://genesisbackend.sovryn.app/genesis');
console.log(origin);
console.log(pathname)


const socket = io(origin, {
    reconnectionDelayMax: 10000,
    path: pathname && pathname !== '/' ? pathname : '',
})

class DBCtrl {
    static get $inject() {
        return ['$scope'];
    }

    constructor($scope) {
        this.$scope = $scope;

        setTimeout(() => {
           console.log("Socket connected", socket.id);

           this.getDeposits();
           this.getTransfers();
        }, 500);
    }

    getDeposits() {
        this.totalDeposit = {
            btc: 0,
            usd: 0
        };
        socket.emit('getDeposits', (data) => {

            this.data = (data || []).map(item => {
                if (item.valueBtc > 0) {
                    this.totalDeposit.btc += Number(item.valueBtc)/1e8;
                    item.valueBtc = (Number(item.valueBtc)/1e8).toFixed(6).replace(/0+$/, '');
                }
                if (item.valueUsd > 0) {
                    this.totalDeposit.usd += Number(item.valueUsd);
                    item.valueUsd = Number(item.valueUsd).toFixed(3);
                }
                return item;
            });
            this.totalDeposit.btc = this.totalDeposit.btc.toFixed(6).replace(/0+$/, '');
            this.totalDeposit.usd = this.totalDeposit.usd.toFixed(3);

            this.numberOfDeposits = this.data.length;
            this.avgSizeDeposit = this.totalDeposit.btc / this.data.length;
            this.$scope.$apply();
        });
    }

    getTransfers() {
        this.totalTransfer = {
            btc: 0,
            usd: 0
        };
        socket.emit('getTransfers', (data) => {
            this.transfers = (data || []).map(item => {
                if (item.valueBtc > 0) {
                    this.totalTransfer.btc += Number(item.valueBtc)/1e8;
                    item.valueBtc = (Number(item.valueBtc)/1e8).toFixed(6).replace(/0+$/, '');
                }
                if (item.valueUsd > 0) {
                    this.totalTransfer.usd += Number(item.valueUsd);
                    item.valueUsd = Number(item.valueUsd).toFixed(3);
                }
                return item;
            });
            this.totalTransfer.btc = this.totalTransfer.btc.toFixed(6).replace(/0+$/, '');
            this.totalTransfer.usd = this.totalTransfer.usd.toFixed(3);

            this.numberOfTransfers = this.data.length;
            this.avgSizeTransfer = this.totalTransfer.btc / this.data.length;
            this.$scope.$apply();
        });
    }
}

angular.module('dbFrontend', [])
    .controller('dbCtrl', DBCtrl);

angular.bootstrap(document, ['dbFrontend']);
