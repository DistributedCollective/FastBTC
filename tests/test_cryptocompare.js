/**
 * Cryptocompare api test
 */

const assert = require('assert');
import helper from "../utils/helper";


describe('Cryptocompare Api', async () => {
    describe('#wallet', async () => {        
        it('should return a valid RBtc price', async () => {
            const rBtcPrice = await helper.getRbtcPrice();
            console.log("current Rbtc price is "+rBtcPrice);
            assert(rBtcPrice >0);
        });
       
        it('should return a valid Btc price', async () => {
            const btcPrice = await helper.getBTCPrice();
            console.log("----")
            console.log(btcPrice)
            console.log("current Btc price is ");
            assert(btcPrice >0);
        });
    
    });
});


