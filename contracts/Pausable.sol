pragma solidity ^0.4.17;

contract Pausable {
    address private owner;
    bool private isActive;

    event LogResume(address indexed sender, bool isActive);
	event LogPause(address indexed sender, bool isActive);
    event LogSetOwner(address indexed oldOwner, address indexed newOwner);

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

    function getOwner()
        public
        view
        returns (address)
    {
        return owner;
    }

    function setOwner(address newOwner)
        public
        onlyOwner()
    {
        owner = newOwner;
        LogSetOwner(msg.sender, newOwner);
    }

    function getIsActive() 
        public 
        view
        returns (bool)
    {
        return isActive;
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