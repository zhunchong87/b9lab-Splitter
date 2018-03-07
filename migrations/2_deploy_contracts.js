var Splitter = artifacts.require("./Splitter.sol");

module.exports = function(deployer) {
  deployer.deploy(Splitter, 
  	"0xf17f52151ebef6c7334fad080c5704d77216b732",
  	"0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef",
  	"0x821aea9a577a9b44299b9c15c88cf3087f3b5544");
};
