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
	var evenFund = web3.toWei(0.01, "ether");
	var oddFund = evenFund + 1;

	// Set the initial test state before running each test
	beforeEach("deploy new Splitter instance", function(){
		return Splitter.new({from: owner})
		.then(instance => splitterContract = instance);
	});

	// Write tests here
	it("should accept funds and display the correct balance in the contract.", function(){
		return splitterContract.splitEther(bob, carol, {from: alice, value: evenFund})
		.then(function(txn){
			return web3.eth.getBalancePromise(splitterContract.address);
		})
		.then(function(contractBalance){
			assert.strictEqual(contractBalance.toString(10), evenFund, "Contract balance does not tally with the sender's fund sent.");
		});
	});

	describe("splitEther", function(){
		it("should split even amount to two person.", function(){
			return splitterContract.splitEther(bob, carol, {from: alice, value: evenFund})
			.then(function(txn){
				// Check split event is logged
				assert.strictEqual(txn.logs.length, 1, 				"Split event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogSplit", 	"Event logged is not a Split event.");
				assert.strictEqual(txn.logs[0].args.sender, alice, 	"Wrong sender.");
				assert.strictEqual(txn.logs[0].args.bob, bob, 		"Wrong split recipients 1.");
				assert.strictEqual(txn.logs[0].args.carol, carol, 	"Wrong split recipients 2.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), evenFund, "Wrong sender amount.");
				return splitterContract.withdrawBalances(bob);
			})
			.then(function(bobBalance){
				assert.strictEqual(bobBalance.toNumber(10), evenFund/2, "Balance is not split properly to Bob.");
				return splitterContract.withdrawBalances(carol);
			})
			.then(function(carolBalance){
				assert.strictEqual(carolBalance.toNumber(10), evenFund/2, "Balance is not split properly to Carol.");
			});
		});

		it("should split odd amount to two person. Remainder is accounted under sender's balance.", function(){
			return splitterContract.splitEther(bob, carol, {from: alice, value: oddFund})
			.then(function(txn){
				// Check split event is logged
				assert.strictEqual(txn.logs.length, 1, 				"Split event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogSplit", 	"Event logged is not a Split event.");
				assert.strictEqual(txn.logs[0].args.sender, alice, 	"Wrong sender.");
				assert.strictEqual(txn.logs[0].args.bob, bob, 		"Wrong split recipients 1.");
				assert.strictEqual(txn.logs[0].args.carol, carol, 	"Wrong split recipients 2.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), oddFund, "Wrong sender amount.");
				return splitterContract.withdrawBalances(bob);
			})
			.then(function(bobBalance){
				assert.strictEqual(bobBalance.toNumber(10), oddFund/2, "Balance is not split properly to Bob.");
				return splitterContract.withdrawBalances(carol);
			})
			.then(function(carolBalance){
				assert.strictEqual(carolBalance.toNumber(10), oddFund/2, "Balance is not split properly to Carol.");
				return splitterContract.withdrawBalances(alice);
			})
			.then(function(senderBalance){
				assert.strictEqual(senderBalance.toNumber(10), web3.toBigNumber(oddFund).mod(2).toNumber(10), "Balance remainder is not returned to Alice.");
			});
		});
	});

	describe("withdraw", function(){
		beforeEach("split amount to the two recipients", function(){
			return splitterContract.splitEther(bob, carol, {from: alice, value: evenFund})
			.then(function(txn){
				// Check split event is logged
				assert.strictEqual(txn.logs.length, 1, 				"Split event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogSplit", 	"Event logged is not a Split event.");
				assert.strictEqual(txn.logs[0].args.sender, alice, 	"Wrong sender.");
				assert.strictEqual(txn.logs[0].args.bob, bob, 		"Wrong split recipients 1.");
				assert.strictEqual(txn.logs[0].args.carol, carol, 	"Wrong split recipients 2.");
				assert.strictEqual(txn.logs[0].args.amount.toString(10), evenFund, "Wrong sender amount.");				
			});
		});

		it("should reduce the contract balance after withdrawal.", function(){
			return splitterContract.withdraw({from: bob})
			.then(function(txn){
				// Check withdraw event is logged
				assert.strictEqual(txn.logs.length, 1, "Withdraw event is not emitted.");
				assert.strictEqual(txn.logs[0].event, "LogWithdraw", "Event logged is not a Withdraw event.");
				assert.strictEqual(txn.logs[0].args.withdrawer, bob, "Wrong withdrawer.");
				assert.strictEqual(txn.logs[0].args.amount.toNumber(10), evenFund/2, "Wrong withdrawal amount.");
				return web3.eth.getBalancePromise(splitterContract.address);
			})
			.then(function(splitterBalance){
				assert.strictEqual(splitterBalance.toNumber(10), evenFund/2, "Wrong contract balance.");
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
				assert.strictEqual(txn.logs[0].args.amount.toNumber(10), evenFund/2, "Wrong withdrawal amount.");
				gasUsed = txn.receipt.gasUsed;
				return web3.eth.getTransactionPromise(txn.tx);
			})
			.then(function(txn){
				gasPrice = txn.gasPrice;
				return web3.eth.getBalancePromise(bob);
			})
			.then(function(_bobAfterWithdrawBalance){
				var txnFee = gasPrice.times(gasUsed);
				assert.strictEqual(_bobAfterWithdrawBalance.minus(bobInitialRealBalance).plus(txnFee).toNumber(10), 
									evenFund/2, 
									"Something is wrong with Bob's balance after withdrawal.");
			});
		});
	});

});