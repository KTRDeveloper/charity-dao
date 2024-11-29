// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CharityToken.sol";

abstract contract CharityTreasury is Ownable, ReentrancyGuard{

    uint256 _amountOfTokenForOneEther = 2;
    mapping(address => uint256) _donations;
    CharityToken _token;

    event NewDonation(address donor, uint256 amount);
    event TokensTransferToBeneficiary(address beneficiary, uint256 amount);
    event EthersTransferToBeneficiary(address beneficiary, uint256 amount);

    constructor(address initialOwner, CharityToken _ctk) Ownable(initialOwner) {
        _token = _ctk;
    }

    function mintTokens(uint256 amount) public onlyOwner {
        _token.mint(address(this), amount);
    }
    function burnTokens(uint256 amount) public onlyOwner {
        _token.burn(amount);
    }
    function donate(bool acceptTokenReward) public payable {
        _donations[msg.sender] += msg.value;

        if(acceptTokenReward){
            sendTokensToRewardDonor(msg.value, msg.sender);
        }
        emit NewDonation(msg.sender, msg.value);
    }

    function isDonor(address user) public view returns(bool) {
        return _donations[user] > 0;
    }
    function getUserTotalDonations(address user) public view returns(uint256) {
        return _donations[user];
    }

    function sendTokensToRewardDonor(uint256 amountDonated, address donor) private onlyOwner {
         uint256 amountOfCHT = amountDonated * _amountOfTokenForOneEther;
        require(_token.balanceOf(address(this)) > amountOfCHT, "Insufficient Tokens");
        _token.transfer(donor, amountOfCHT);
    }

    function getAmountOfTokenForOneEther() public view returns(uint256) {
        return _amountOfTokenForOneEther;
    }
    function setAmountOfTokenForOneEther(uint256 amount) public onlyOwner{
        _amountOfTokenForOneEther = amount;
    }

    //This method is protected against reentrancy attack using the nonReentrant modifier
    function transferEthers(address payable beneficiary, uint256 amount) public onlyOwner nonReentrant {
        require(amount > address(this).balance, "Insufficient funds!");
        // Call returns a boolean value indicating success or failure. This is the recommended method to use
        (bool sent, ) = beneficiary.call{value: amount}("");
        require(sent, "Transfer failled!");
        emit EthersTransferToBeneficiary(beneficiary, amount);
    }

    // Tranfer tokens from the tresury to a given beneficiary
    function transferTokens(address beneficiary, uint256 amount) public onlyOwner {
        require(_token.balanceOf(address(this)) > amount, "Insufficient Tokens");
        _token.transfer(beneficiary, amount);
        emit TokensTransferToBeneficiary(beneficiary, amount);
    }
    
    // Send all the ethers held by the treasury to a given address 
    function releaseEthers(address beneficiary) public onlyOwner {
        uint256 ethTreasuryBalance = address(this).balance;
        payable(beneficiary).transfer(ethTreasuryBalance);
        emit EthersTransferToBeneficiary(beneficiary, ethTreasuryBalance);
    }
    
    // Send all the tokens held by the treasury to a given address 
    function releaseTokens(address beneficiary) public onlyOwner {
        uint256 tokenTreasuryBalance = _token.balanceOf(address(this));
        _token.transfer(beneficiary, tokenTreasuryBalance);
        emit TokensTransferToBeneficiary(beneficiary, tokenTreasuryBalance);
    }
}
