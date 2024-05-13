/* eslint-disable prefer-const */
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";

// Same as `abi.encodePacked` in Solidity
function encodePacked(address: any, spots: any) {
  return ethers.solidityPacked(["address", "uint256"], [address, spots]);
}

describe("AirDrop", function () {
  async function deployTokenFixture() {
    const [owner, account1, account2, account3] = await ethers.getSigners();
    const AirDrop = await ethers.getContractFactory("AirDrop");
    const airDrop = await AirDrop.deploy();
    await airDrop.waitForDeployment();
    await airDrop.initialize(owner);

    const myToken = await ethers.getContractFactory("MyToken");
    const _myToken = await myToken.deploy();
    await _myToken.waitForDeployment();
    const _myToken2 = await myToken.deploy();
    await _myToken2.waitForDeployment();

    await _myToken.mint(owner.address, 100000000);
    await _myToken2.mint(owner.address, 100000000);

    console.log("AirDrop: " + (await airDrop.getAddress()));
    console.log("MyToken: " + (await _myToken.getAddress()));
    console.log("MyToken: " + (await _myToken2.getAddress()));

    return { airDrop, _myToken, _myToken2, owner, account1, account2, account3 };
  }

  describe("test", function () {
    it("", async function () {
      const { airDrop, _myToken, _myToken2, owner, account1, account2, account3 } =
        await loadFixture(deployTokenFixture);
      let tokenAdd = await airDrop.getAddress();
      let myTokenAdd = await _myToken.getAddress();

      let tx = await _myToken.transfer(tokenAdd, 2);
      await tx.wait();
      console.log("AirDrop bal = ", await _myToken.balanceOf(tokenAdd));
      let list = [encodePacked(owner.address, 2), encodePacked(account1.address, 2)];

      console.log("list = ", list);

      //构造树
      let tree = new MerkleTree(list, ethers.keccak256, { hashLeaves: true, sortPairs: true });
      // 获取树根
      let root = tree.getHexRoot();
      console.log("tree = ", tree.toString());
      console.log("root = ", root);
      await airDrop.setRootAndToken(root, myTokenAdd);

      //获取树叶
      let leaf = ethers.keccak256(list[0]);
      //获取证明
      let proof = tree.getHexProof(leaf);
      console.log("leaf = ", leaf);
      console.log("proof = ", proof);

      console.log("hasClaimed = ", await airDrop.hasClaimed(root, myTokenAdd, owner.address));
      await airDrop.claim(owner.address, 2, proof, root, myTokenAdd);
      console.log("hasClaimed = ", await airDrop.hasClaimed(root, myTokenAdd, owner.address));
    });
  });
});
