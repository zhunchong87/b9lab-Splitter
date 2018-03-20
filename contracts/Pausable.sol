pragma solidity ^0.4.17;

contract Pausable {
    address public owner;
    bool isActive;

    event LogResume(address indexed sender, string message);
	event LogPause(address indexed sender, string message);

    function Pausable() public {
        owner = msg.sender;
        isActive = true;
    }

    modifier onlyOwner () {
        require(msg.sender == owner);
        _;
    }

    modifier onlyActive () {
        require(isActive == true || msg.sender == owner);
        _;
    }

    function pause()
    	public
    	onlyOwner()
	{
		isActive = false;
		LogPause(msg.sender, "Contract is paused.");
	}

	function resume()
    	public
    	onlyOwner()
	{
		isActive = true;
		LogResume(msg.sender, "Contract is resumed.");
	}
}