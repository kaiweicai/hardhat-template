// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TYTY is ERC20, Ownable {
    // // The address of the manager
    // address public manager;
    // The marketing wallet allocation ratio, in ten-thousandths
    uint256 public constant MARKETING_WALLET_RATE = 200;
    // The liquidity wallet allocation ratio, in ten-thousandths
    uint256 public constant LIQUIDITY_WALLET_RATE = 400;
    // The first-generation promotion ratio, in ten-thousandths
    uint256 public constant FIRST_GENERATION_RATE = 150;
    // The second-generation promotion ratio, in ten-thousandths
    uint256 public constant SECOND_GENERATION_RATE = 50;
    // the divisor
    uint256 public constant DIVISOR = 10000;

    // The marketing wallet address
    address public marketingWallet;
    // The LP dividend wallet for the liquidity pool
    address public liquidityWallet;

    // Record the referral relationships of users. The key is the referred user, and the value is the referrer.
    mapping(address => address) public referrals;
    // Reverse mapping, used to quickly find all referrals
    mapping(address => address[]) public allRecommend;

    constructor(
        string memory name,
        string memory symbol,
        address _marketingWallet,
        address _liquidityWallet,
        address _mineWallet,
        uint256 _initMintAmount
    ) ERC20(name, symbol) Ownable(_msgSender()) {
        super._mint(_mineWallet, _initMintAmount);
        marketingWallet = _marketingWallet;
        liquidityWallet = _liquidityWallet;
    }

    function decimals() public pure override returns (uint8) {
        return 9;
    }

    // function setManager(address _manager) public onlyOwner {
    //     manager = _manager;
    // }

    // modifier onlyManager() {
    //     require(msg.sender == manager, "only manager");
    //     _;
    // }

    function transfer(address to, uint256 amount) public override returns (bool) {
        return _transferWithReferral(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        return _transferWithReferral(from, to, amount);
    }

    function _transferWithReferral(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        // Handle the referral relationship
        if (referrals[to] == address(0)) {
            referrals[to] = from;
            allRecommend[from].push(to);
        }

        // First transfer the full amount to 'to'
        _transfer(from, to, amount);

        uint256 marketingAmount = (amount * MARKETING_WALLET_RATE) / DIVISOR;
        uint256 liquidityAmount = (amount * LIQUIDITY_WALLET_RATE) / DIVISOR;
        uint256 firstGenerationAmount = (amount * FIRST_GENERATION_RATE) / DIVISOR;
        uint256 secondGenerationAmount = (amount * SECOND_GENERATION_RATE) / DIVISOR;

        // Deduct and distribute the corresponding amounts from 'to''s account
        _transfer(to, referrals[to], firstGenerationAmount);
        if (referrals[referrals[to]] != address(0)) {
            _transfer(to, referrals[referrals[to]], secondGenerationAmount);
        } else {
            _transfer(to, referrals[to], secondGenerationAmount);
        }
        _transfer(to, marketingWallet, marketingAmount);
        _transfer(to, liquidityWallet, liquidityAmount);

        return true;
    }
}
