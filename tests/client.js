const io = require("socket.io-client");
const { origin, pathname } = new URL('http://localhost:3007/');
console.log(origin);
console.log(pathname)


const socket = io(origin, {
    reconnectionDelayMax: 10000,
    path: pathname && pathname !== '/' ? pathname : '',
})


socket.on('connect', function(){
    console.log("connected");
    //getHist();
    //getCosignerIndex();
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


function getCosignerIndex(){
    socket.emit("getCosignerIndex", (res) => {
        if(res&&res.error) {
            console.error("Error retrieving history");
            console.error(res);
            return;
        }
        
        console.log("response");
        console.log(res);
    });
    
}



