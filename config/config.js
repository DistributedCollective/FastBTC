import conf_mainnet from "./config-main";
import conf_testnet from "./config-test";

let config = conf_testnet;
if (process.argv && process.argv[2]=="mainnet") config = conf_mainnet;

export default config;
