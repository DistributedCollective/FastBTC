import conf_mainnet from "./config-main";
import conf_testnet from "./config-test";

let config = conf_mainnet;
if (process.argv && process.argv[2]=="mainnet") config = conf_mainnet;

export default config;
