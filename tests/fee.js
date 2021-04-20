
let amount = 10000000;

 let transferValueSatoshi = Number(amount) - 10000; //subtract base fee
 transferValueSatoshi=transferValueSatoshi-(transferValueSatoshi/1000*2); //subtract 0.2% commision
 transferValueSatoshi = Number(Math.max(transferValueSatoshi, 0).toFixed(0));
 console.log("transferValueSatoshi "+transferValueSatoshi)
