// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
contract MazeProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        address crAdmin,
        bytes memory _data
    ) TransparentUpgradeableProxy(_logic, crAdmin, _data) {}
}