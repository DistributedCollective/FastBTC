import confMainnet from "./config-main";
import confTestnet from "./config-test";

let config = confTestnet;
let overrideModule = "./config-test.override.js";

if (process.argv && process.argv[2]=="mainnet") {
    config = confMainnet;
    overrideModule = "./config-main.override.js";
}

try {
    console.log("attempting to load overrides from %s", overrideModule);
    const extraConfig = require(overrideModule);
    config = {...config, ...extraConfig['default']}
    console.log("override config successfully merged");
}
catch (e) {
    console.log("override module not available: %s", e.toString());
}

export default config;
