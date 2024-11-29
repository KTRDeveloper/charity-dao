// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "./CharityTreasury.sol";
import "./CharityToken.sol";

contract CharityTimelock is TimelockController, CharityTreasury {
    constructor(
        uint256 _minDelay,
        address[] memory _proposers,
        address[] memory _executors,
        address admin, 
        address initialOwner, 
        CharityToken _ctk
    ) TimelockController(_minDelay, _proposers, _executors, admin) CharityTreasury(initialOwner, _ctk){}
}
