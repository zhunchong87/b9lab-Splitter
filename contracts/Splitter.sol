pragma solidity ^0.4.17;

contract Splitter{
	address[3] people;
	mapping(address => uint) withdrawBalances;

	function Splitter(address alice, address bob, address carol) public{
		require(alice != address(0) && bob != address(0) && carol != address(0));
		people[0] = alice;
		people[1] = bob;
		people[2] = carol;
	}

	/*
		Returns the people associated with the Splitter contract.
	*/
	function getPeople() 
		view 
		public 
		returns(address[3])
	{
		return people;
	}

	/*
		Splits the amount received equally between the other two person.
	*/
	function sendEther() 
		public 
		payable 
	{
		require(msg.value > 0);
		uint amt = msg.value / 2;
		uint reminder = msg.value % 2;

		for(uint8 i=0; i<people.length; i++){
			// Split amount the other 2 person
			if(msg.sender != people[i]){
				withdrawBalances[people[i]] += amt;
			}
			// Return reminder back to sender
			else if(msg.sender == people[i] && reminder > 0){
				withdrawBalances[people[i]] += reminder;
			}
		}
	}

	/*
		Returns the withdrawal balance of the person
	*/
	function getWithdrawableBalance(address person) 
		view
		public
		returns (uint)
	{
		return withdrawBalances[person];
	}

	/*
		Transfer the entire withdrawable funds to the person
	*/
	function withdrawBalance()
		public
	{
		require(withdrawBalances[msg.sender] > 0);
		msg.sender.transfer(withdrawBalances[msg.sender]);
		withdrawBalances[msg.sender] = 0;
	}

	/*
	 	Do not accept any funds from other sources. Otherwise the contract's balance
	 	will be inaccurate.
	*/
	function() public payable{ revert(); }
}