import Web3 from 'web3';

window.addEventListener('load', async () => {
    if (window.web3) {
        console.log("web3 provider found");
        window.web3 = new Web3(window.web3.currentProvider);
        await window.ethereum.enable();

        const accounts = await web3.eth.getAccounts();
        console.log("main adr: "+accounts[0]);
        window.acc = accounts[0];
        console.log("web3 loaded", new Date());
        window.ethEnabled = true;
    } else {
        window.ethEnabled = false;
    }

    window.web3Initialized = true;
});
