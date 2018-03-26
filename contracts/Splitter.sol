pragma solidity ^0.4.17;
import "./Pausable.sol";

contract Splitter is Pausable{
	mapping(address => uint) public withdrawBalances;
	event LogSplit(address indexed sender, address indexed bob, address indexed carol, uint amount);
	event LogWithdraw(address indexed withdrawer, uint amount);

	function Splitter(bool isActive) Pausable(isActive) public{
	}

	/*
		Splits the amount received equally between two person.
	*/
	function splitEther(address bob, address carol) 
		public 
		payable 
		onlyActive()
	{
		require(bob != address(0) && carol != address(0));
		require(msg.value > 0);
		uint amt = msg.value / 2;
		uint remainder = msg.value % 2;

		// Split amount
		withdrawBalances[bob] += amt;
		withdrawBalances[carol] += amt;

		// Return remainder back to sender
		withdrawBalances[msg.sender] += remainder;
		LogSplit(msg.sender, bob, carol, msg.value);
	}

	/*
		Transfer the entire withdrawable funds to the person
	*/
	function withdraw()
		public
		onlyActive()
	{
		uint amt = withdrawBalances[msg.sender];
		require(amt > 0);
		withdrawBalances[msg.sender] = 0;
		LogWithdraw(msg.sender, amt);

		// Interact with untrusted address last.
		msg.sender.transfer(amt);
	}

	/*
	 	Do not accept any funds from other sources. 
	 	Otherwise the contract's balance will be inaccurate.
	*/
	function() public payable{ revert(); }
}