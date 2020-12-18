

var socket = require('socket.io-client')('https://testnet.sovryn.app/',{
    path: '/fastbtc'
  });


socket.on('connect', function(){
    console.log("connected");
    getHist();
});

socket.on('disconnect', function(){
    console.log("disconnected")
});



function getHist() {
    socket.emit("getDepositHistory", "0x2bD2201BFE156A71EB0D02837172ffc237218505", (res, res2) => {
        if(res&&res.error) {
            console.error("Error retrieving history");
            console.error(res);
            return;
        }
        
        console.log("response");
        console.log(res);
        console.log(res2)
    });
}



