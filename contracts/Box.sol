// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
contract Box is Ownable, UUPSUpgradeable, Initializable {
    uint256 private _value;
    constructor() Ownable(_msgSender()) {}

    function initialize() public initializer {
        _transferOwnership(msg.sender);
    }

    function get() external view returns (uint256) {
        return _value;
    }
    function set(uint256 value) external onlyOwner {
        _value = value;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}
}
