const config = window.FASTBTC_CONFIG;
const { origin, pathname } = new URL(config ? config.backendUrl : 'http://3.131.33.161:3000');

const socket = io(origin, {
    reconnectionDelayMax: 10000,
    path: pathname && pathname !== '/' ? pathname : '',
});

class UserSearchCtrl {
    static get $inject() {
        return ['$scope'];
    }

    constructor($scope) {
        this.$scope = $scope;

        $scope.sort = function(keyname){
            $scope.sortKey = keyname;   //set the sortKey to the param passed
            $scope.reverse = !$scope.reverse; //if true make it false and vice versa
        }
    }

    getRskExplorerUrl(address) {
        return config.blockExplorer + '/address/' + address;
    }

    getBtcExplorerUrl(address) {
        if (address[0] === 't' || address[0] === '2') {
            return 'https://www.blockchain.com/btc-testnet/address/' + address;
        }

        return 'https://www.blockchain.com/btc/address/' + address;
    }

    search() {
        const sought = this.address;
        socket.emit('getUsersByAddress', sought.replace('*', '%'), (data) => {
            this.users = data;
            this.appliedSearchString = sought;
            this.$scope.$apply();
        });
    }
}

angular.module('userSearchFrontend', ['angularUtils.directives.dirPagination'])
    .controller('userSearchCtrl', UserSearchCtrl);

angular.bootstrap(document, ['userSearchFrontend']);
