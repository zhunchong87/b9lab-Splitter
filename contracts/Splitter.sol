pragma solidity ^0.4.17;

contract Splitter{
	address[3] people;

	function Splitter(address alice, address bob, address carol) public{
		people[0] = alice;
		people[1] = bob;
		people[2] = carol;
	}

	function getPeople() 
		view 
		public 
		returns(address[3])
	{
		return people;
	}

	function getPeopleBalance()
		view
		public
		returns(uint[3])
	{
		uint[3] memory balances;
		balances[0] = people[0].balance;
		balances[1] = people[1].balance;
		balances[2] = people[2].balance;
		return balances;
	}

	function sendEther() 
		public 
		payable 
	{		
		for(uint8 i=0; i<people.length; i++){
			if(msg.sender != people[i]){
				people[i].transfer(msg.value / 2);
			}
		}
	}

	function() public payable{}
}