pragma solidity ^0.4.17;

contract Pausable {
    address public owner;
    bool isActive;

    event LogResume(address indexed sender, bool isActive);
	event LogPause(address indexed sender, bool isActive);

    function Pausable(bool _isActive) public {
        owner = msg.sender;
        isActive = _isActive;
    }

    modifier onlyOwner () {
        require(msg.sender == owner);
        _;
    }

    modifier onlyActive () {
        require(isActive == true);
        _;
    }

    function pause()
    	public
    	onlyOwner()
        onlyActive()
	{
		isActive = false;
		LogPause(msg.sender, isActive);
	}

	function resume()
    	public
    	onlyOwner()
	{
        require(isActive == false);
		isActive = true;
		LogResume(msg.sender, isActive);
	}
}