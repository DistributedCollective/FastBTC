import conf_mainnet from "./config-main";
import conf_testnet from "./config-test";

let config;
if (process.argv && process.argv[2]=="mainnet") config = conf_mainnet;
else config = conf_testnet

export default config;
