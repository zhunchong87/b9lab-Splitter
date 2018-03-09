var Splitter = artifacts.require("./Splitter.sol");
var Promise = require("bluebird");

contract("Splitter", function(accounts){
	// Declare test variables here
	var splitterContract;
	var owner = accounts[0];
	const getBalancePromise = Promise.promisify(web3.eth.getBalance);

	// The unit of measurement here is ether
	var evenFund = web3.toWei(web3.toBigNumber(2), "ether");
	var oddFund = web3.toWei(web3.toBigNumber(2), "ether").plus(1);

	// Set the initial test state before running each test
	beforeEach(function(){
		return Splitter.new(accounts[1], accounts[2], accounts[3], {from: owner})
		.then(instance => splitterContract = instance);
	});

	// Write tests here
	it("should accept funds and display the correct balance in the contract.", function(){
		return splitterContract.sendEther({from: accounts[1], value: evenFund})
		.then(function(txn){
			return getBalancePromise(splitterContract.contract.address);
		})
		.then(function(contractBalance){
			assert.equal(contractBalance.toString(10), evenFund, "Contract balance does not tally with the sender's fund sent.");
		});
	});

	it("should accept funds (even amount) from one person and split the funds to two person.", function(){
		var people;
		return splitterContract.sendEther({from: accounts[1], value: evenFund})
		.then(function(txn){
			return splitterContract.getPeople();
		})
		.then(function(_people){
			people = _people;
			return splitterContract.getWithdrawableBalance(people[1]);
		})
		.then(function(person1Balance){
			assert.equal(person1Balance.toString(10), evenFund/2, "Balance is not split properly to person 1.");
			return splitterContract.getWithdrawableBalance(people[2]);
		})
		.then(function(person2Balance){
			assert.equal(person2Balance.toString(10), evenFund/2, "Balance is not split properly to person 2.");
		});
	});

	it("should accept funds (odd amount) from one person and split the funds to two person. Reminder amount should be transferred to the sender's balance.", function(){
		var people;
		return splitterContract.sendEther({from: accounts[1], value: oddFund})
		.then(function(txn){
			return splitterContract.getPeople();
		})
		.then(function(_people){
			people = _people;
			return splitterContract.getWithdrawableBalance(people[1]);
		})
		.then(function(person1Balance){
			assert.equal(person1Balance.toString(10), oddFund/2, "Balance is not split properly to person 1.");
			return splitterContract.getWithdrawableBalance(people[2]);
		})
		.then(function(person2Balance){
			assert.equal(person2Balance.toString(10), oddFund/2, "Balance is not split properly to person 2.");
			return splitterContract.getWithdrawableBalance(people[0]);
		})
		.then(function(senderBalance){
			assert.equal(senderBalance.toString(10), oddFund.mod(2), "Balance is not split properly to sender.");
		});
	});

	it("should accept funds and 1 person should successfully withdraw his/her funds back.", function(){
		var people;
		var person1ContractBalance;
		var person1InitialBalance;

		return splitterContract.sendEther({from: accounts[1], value: evenFund})
		.then(function(txn){
			return splitterContract.getPeople();
		})
		.then(function(_people){
			people = _people;
			return splitterContract.getWithdrawableBalance(people[1]);
		})
		.then(function(_person1Balance){
			assert.equal(_person1Balance.toString(10), evenFund/2, "Balance is not split properly to person 1.");
			person1ContractBalance = _person1Balance;
			return getBalancePromise(people[1]);
		})
		.then(function(_person1CurrentBalance){
			person1InitialBalance = _person1CurrentBalance;
			return splitterContract.withdrawBalance({from: people[1]});
		})
		.then(function(txn){
			assert.strictEqual(txn.receipt.status, 1, "Something has gone wrong with withdrawal.");
			return getBalancePromise(people[1]);
		})
		.then(function(_person1AfterWithdrawBalance){
			assert.isBelow(web3.fromWei(_person1AfterWithdrawBalance.minus(person1InitialBalance), "ether"), 1, "Something is wrong with person 1 balance after withdrawal.");
		});
	});
});