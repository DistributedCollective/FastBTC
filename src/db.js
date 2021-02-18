

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
        this.total = {
            btc: 0,
            usd: 0
        };
        socket.emit('getDeposits', (data) => {

            this.data = (data || []).map(item => {
                if (item.valueBtc > 0) {
                    this.total.btc += Number(item.valueBtc)/1e8;
                    item.valueBtc = (Number(item.valueBtc)/1e8).toFixed(6).replace(/0+$/, '');
                }
                if (item.valueUsd > 0) {
                    this.total.usd += Number(item.valueUsd);
                    item.valueUsd = Number(item.valueUsd).toFixed(3);
                }
                return item;
            });
            this.total.btc = this.total.btc.toFixed(6).replace(/0+$/, '');
            this.total.usd = this.total.usd.toFixed(3);
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
            this.$scope.$apply();
        });
    }
}

angular.module('dbFrontend', [])
    .controller('dbCtrl', DBCtrl);

angular.bootstrap(document, ['dbFrontend']);
