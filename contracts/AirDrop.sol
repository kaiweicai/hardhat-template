// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract AirDrop is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    uint256 private index;
    using SafeERC20 for IERC20;
    mapping(bytes32 => mapping(address => uint256)) public indexs;
    mapping(uint256 => mapping(address => bool)) public isClaimed;

    mapping(address => bool) public isManager;

    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    function initialize(address owner) public initializer {
        __Ownable_init(owner);
        isManager[msg.sender] = true;
    }
    //设置根、空投token
    function setRootAndToken(bytes32 _root, address _tokenAddress) external onlyOwner {
        indexs[_root][_tokenAddress] = ++index;
    }

    function hasClaimed(bytes32 _root, address token, address _address) external view returns (bool) {
        uint256 _index = indexs[_root][token];
        return isClaimed[_index][_address];
    }

    function claim(
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof,
        bytes32 _root,
        address token
    ) external nonReentrant {
        uint256 _index = indexs[_root][token];
        require(_index > 0, "root token not exist");
        // should check the _index is bt zero
        require(!isClaimed[_index][account], "Already claimed.");

        bytes32 _leaf = keccak256(abi.encodePacked(account, amount));
        bool isValidProof = MerkleProof.verifyCalldata(merkleProof, _root, _leaf);
        require(isValidProof, "Invalid proof.");

        isClaimed[_index][account] = true;
        IERC20 dropToken = IERC20(token);
        uint256 bal = dropToken.balanceOf(address(this));
        require(bal >= amount, "Insufficient balance");

        dropToken.safeTransfer(account, amount);
    }
}
