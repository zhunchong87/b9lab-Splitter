var Splitter = artifacts.require("./Splitter.sol");
const Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

contract("Splitter", function(accounts){
	// Declare test variables here
	var splitterContract;
	var owner = accounts[0];
	var alice = accounts[1];
	var bob = accounts[2];
	var carol = accounts[3];

	// The unit of measurement here is ether
	const amount = web3.toWei(0.01), expected = web3.toWei(0.005), amountOdd = amount + 1;

	// Set the initial test state before running each test
	beforeEach("deploy new Splitter instance", function(){
		return Splitter.new({from: owner})
		.then(instance => splitterContract = instance);
	});

	// Write tests here
	it("should accept funds and display the correct balance in the contract.", function(){
		return splitterContract.splitEther(bob, carol, {from: alice, value: amount})
		.then(function(txn){
			return web3.eth.getBalancePromise(splitterContract.address);
		})
		.then(function(contractBalance){
			assert.strictEqual(contractBalance.toString(10), amount, "Contract balance does not tally with the sender's fund sent.");
		});
	});

	describe("splitEther", function(){
		it("should split even amount to two person.", function(){
			return splitterContract.splitEther(bob, carol, {from: alice, value: amount})
			.then(function(txn){
				// Check split event is logged
				assert.strictEqual(txn.logs.length, 1, 				"Split event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogSplit", 	"Event logged is not a Split event.");
				assert.strictEqual(txn.logs[0].args.sender, alice, 	"Wrong sender.");
				assert.strictEqual(txn.logs[0].args.bob, bob, 		"Wrong split recipients 1.");
				assert.strictEqual(txn.logs[0].args.carol, carol, 	"Wrong split recipients 2.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), amount, "Wrong sender amount.");
				return splitterContract.withdrawBalances(bob);
			})
			.then(function(bobBalance){
				assert.strictEqual(bobBalance.toString(10), expected, "Balance is not split properly to Bob.");
				return splitterContract.withdrawBalances(carol);
			})
			.then(function(carolBalance){
				assert.strictEqual(carolBalance.toString(10), expected, "Balance is not split properly to Carol.");
			});
		});

		it("should split odd amount to two person. Remainder is accounted under sender's balance.", function(){
			return splitterContract.splitEther(bob, carol, {from: alice, value: amountOdd})
			.then(function(txn){
				// Check split event is logged
				assert.strictEqual(txn.logs.length, 1, 				"Split event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogSplit", 	"Event logged is not a Split event.");
				assert.strictEqual(txn.logs[0].args.sender, alice, 	"Wrong sender.");
				assert.strictEqual(txn.logs[0].args.bob, bob, 		"Wrong split recipients 1.");
				assert.strictEqual(txn.logs[0].args.carol, carol, 	"Wrong split recipients 2.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), amountOdd, "Wrong sender amount.");
				return splitterContract.withdrawBalances(bob);
			})
			.then(function(bobBalance){
				assert.strictEqual(bobBalance.toNumber(10), amountOdd/2, "Balance is not split properly to Bob.");
				return splitterContract.withdrawBalances(carol);
			})
			.then(function(carolBalance){
				assert.strictEqual(carolBalance.toNumber(10), amountOdd/2, "Balance is not split properly to Carol.");
				return splitterContract.withdrawBalances(alice);
			})
			.then(function(senderBalance){
				assert.strictEqual(senderBalance.toNumber(10), web3.toBigNumber(amountOdd).mod(2).toNumber(10), "Balance remainder is not returned to Alice.");
			});
		});
	});

	describe("withdraw", function(){
		beforeEach("split amount to the two recipients", function(){
			return splitterContract.splitEther(bob, carol, {from: alice, value: amount})
			.then(function(txn){
				// Check split event is logged
				assert.strictEqual(txn.logs.length, 1, 				"Split event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogSplit", 	"Event logged is not a Split event.");
				assert.strictEqual(txn.logs[0].args.sender, alice, 	"Wrong sender.");
				assert.strictEqual(txn.logs[0].args.bob, bob, 		"Wrong split recipients 1.");
				assert.strictEqual(txn.logs[0].args.carol, carol, 	"Wrong split recipients 2.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), amount, "Wrong sender amount.");				
			});
		});

		it("should reduce the contract balance after withdrawal.", function(){
			return splitterContract.withdraw({from: bob})
			.then(function(txn){
				// Check withdraw event is logged
				assert.strictEqual(txn.logs.length, 1, "Withdraw event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogWithdraw", "Event logged is not a Withdraw event.");
				assert.strictEqual(txn.logs[0].args.withdrawer, bob, "Wrong withdrawer.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), expected, "Wrong withdrawal amount.");
				return web3.eth.getBalancePromise(splitterContract.address);
			})
			.then(function(splitterBalance){
				assert.strictEqual(splitterBalance.toString(10), expected, "Wrong contract balance.");
			});
		});

		it("should allow the recipient to successfully withdraw the funds.", function(){
			var bobInitialRealBalance;
			var gasUsed, gasPrice;

			return web3.eth.getBalancePromise(bob)
			.then(function(_bobCurrentBalance){
				bobInitialRealBalance = _bobCurrentBalance;
				return splitterContract.withdraw({from: bob});
			})
			.then(function(txn){
				// Check withdraw event is logged
				assert.strictEqual(txn.logs.length, 1, "Withdraw event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogWithdraw", "Event logged is not a Withdraw event.");
				assert.strictEqual(txn.logs[0].args.withdrawer, bob, "Wrong withdrawer.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), expected, "Wrong withdrawal amount.");
				gasUsed = txn.receipt.gasUsed;
				return web3.eth.getTransactionPromise(txn.tx);
			})
			.then(function(txn){
				gasPrice = txn.gasPrice;
				return web3.eth.getBalancePromise(bob);
			})
			.then(function(_bobAfterWithdrawBalance){
				var txnFee = gasPrice.times(gasUsed);
				assert.strictEqual(_bobAfterWithdrawBalance.minus(bobInitialRealBalance).plus(txnFee).toString(10), 
									expected, 
									"Something is wrong with Bob's balance after withdrawal.");
			});
		});
	});

	describe("Kill/Pause switch", function(){
		it("should allow owner to pause the contract.", function(){
			return splitterContract.pause({from: owner})
			.then(function(txn){
				// Check pause event is logged
				assert.strictEqual(txn.logs.length, 1, "Pause event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogPause", "Event logged is not a Pause event.");
				assert.strictEqual(txn.logs[0].args.sender, owner, "Wrong owner.");
			});
		});

		it("should allow owner to resume the contract.", function(){
			return splitterContract.resume({from: owner})
			.then(function(txn){
				// Check resume event is logged
				assert.strictEqual(txn.logs.length, 1, "Resume event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogResume", "Event logged is not a Resume event.");
				assert.strictEqual(txn.logs[0].args.sender, owner, "Wrong owner.");
			});
		});

		it("should not allow others to pause the contract.", function(){
			return splitterContract.pause({from: bob})
			.catch(function(err){
				assert.include(err.message, "VM Exception while processing transaction: revert", "Error is not emitted.");
			});
		});

		it("should not allow others to resume the contract.", function(){
			return splitterContract.resume({from: bob})
			.catch(function(err){
				assert.include(err.message, "VM Exception while processing transaction: revert", "Error is not emitted.");
			});
		});

		it("should allow owner to split when the contract is paused.", function(){
			return splitterContract.pause({from: owner})
			.then(function(txn){
				// Check pause event is logged
				assert.strictEqual(txn.logs.length, 1, "Pause event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogPause", "Event logged is not a Pause event.");
				assert.strictEqual(txn.logs[0].args.sender, owner, "Wrong owner.");
				return splitterContract.splitEther(bob, carol, {from: owner, value: amount})
			})
			.then(function(txn){
				// Check split event is logged
				assert.strictEqual(txn.logs.length, 1, 				"Split event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogSplit", 	"Event logged is not a Split event.");
				assert.strictEqual(txn.logs[0].args.sender, owner, 	"Wrong sender.");
				assert.strictEqual(txn.logs[0].args.bob, bob, 		"Wrong split recipients 1.");
				assert.strictEqual(txn.logs[0].args.carol, carol, 	"Wrong split recipients 2.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), amount, "Wrong sender amount.");
			})
		});

		it("should not allow others to split when the contract is paused.", function(){
			return splitterContract.pause({from: owner})
			.then(function(txn){
				// Check pause event is logged
				assert.strictEqual(txn.logs.length, 1, "Pause event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogPause", "Event logged is not a Pause event.");
				assert.strictEqual(txn.logs[0].args.sender, owner, "Wrong owner.");
				return splitterContract.splitEther(bob, carol, {from: alice, value: amount})
			})
			.catch(function(err){
				assert.include(err.message, "VM Exception while processing transaction: revert", "Error is not emitted.");
			});
		});
	});

});