# Project 1 - Splitter
## How to start
1. Run `truffle develop` to initialize the dev environment.
2. Run `migrate` to deploy the Splitter contract.
3. Send ether to the contract via the function `sendEther()`. 
4. Display balance via the function `getPeopleBalance()`.

#### Sample:
```
Splitter.deployed().then(instance => instance.sendEther({from: "0xf17f52151ebef6c7334fad080c5704d77216b732", value: web3.toWei(2,"ether")}));
Splitter.deployed().then(instance => instance.getPeopleBalance());
```

**Note**: 
The `Splitter` contract takes in three default addresses from the `truffle develop` environment. You may need to update those addresses in `./migrations/2_deploy_contracts.js`.

## Todo List
1. Implement web page.
2. Implement stretch goals.
