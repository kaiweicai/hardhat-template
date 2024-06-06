// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract BTCF is ERC20, Ownable {
    using Math for uint256;

    uint256 public constant FEE_PERCENT = 1; // 1% fee

    address public feeReceiver;

    mapping(address => bool) whiteList;

    event TransferWithFee(address indexed from, address indexed to, uint256 value, uint256 fee);
    event FeeWithdrawn(address indexed owner, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address minter
    ) ERC20(name, symbol) Ownable(_msgSender()) {
        _mint(minter, initialSupply);
        feeReceiver = msg.sender;
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        uint256 fee = (amount * FEE_PERCENT) / (100);
        if (whiteList[_msgSender()]) {
            _transfer(_msgSender(), recipient, amount);
        } else {
            uint256 transferAmount = amount - (fee);

            _transfer(_msgSender(), recipient, transferAmount);
            _transfer(_msgSender(), feeReceiver, fee);

            emit TransferWithFee(_msgSender(), recipient, transferAmount, fee);
        }

        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        if (whiteList[_msgSender()]) {
            _transfer(sender, recipient, amount);
            _approve(sender, _msgSender(), allowance(sender, _msgSender()) - amount);
        } else {
            uint256 fee = (amount * FEE_PERCENT) / 100;
            uint256 transferAmount = amount - fee;
            _transfer(sender, recipient, transferAmount);
            _transfer(sender, feeReceiver, fee);
            _approve(sender, _msgSender(), allowance(sender, _msgSender()) - amount);

            emit TransferWithFee(sender, recipient, transferAmount, fee);
        }

        return true;
    }

    function setFeeReceiver(address _feeReceiver) public onlyOwner {
        feeReceiver = _feeReceiver;
    }

    function setWhiteList(address userAddress, bool isWitheList) public onlyOwner returns (bool) {
        whiteList[userAddress] = isWitheList;
        return true;
    }
}
