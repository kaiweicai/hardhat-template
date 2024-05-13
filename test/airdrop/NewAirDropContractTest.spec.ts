/* eslint-disable prefer-const */
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Web3 } from "web3";

// Same as `abi.encodePacked` in Solidity
function encodePacked(address: any, spots: any) {
  return ethers.solidityPacked(["address", "uint256"], [address, spots]);
}

const sweepReceiver: string = "0x1376Dd14c5Ae8dea2f44894A32C151EF7b88598d";
const delegateTo: string = "0x1376Dd14c5Ae8dea2f44894A32C151EF7b88598d";

describe.only("AirDrop", function () {
  async function deployTokenFixture() {
    const [owner, account1, account2, account3] = await ethers.getSigners();

    ethers;

    const MyToken = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy();
    await myToken.waitForDeployment();

    const TokenDistributor = await ethers.getContractFactory("TokenDistributor");
    const tokenDistributor = await TokenDistributor.deploy(myToken, sweepReceiver, owner, 0, 9999644904, delegateTo);
    await tokenDistributor.waitForDeployment();

    await myToken.mint(tokenDistributor, 100000000n);
    const balanceOf = await myToken.balanceOf(tokenDistributor);

    console.log("balanceOf is:", balanceOf);
    return { tokenDistributor, myToken, owner, account1, account2, account3 };
  }

  describe.only("test", function () {
    it("", async function () {
      const { tokenDistributor, myToken, owner, account1, account2, account3 } = await loadFixture(deployTokenFixture);

      const tx = await tokenDistributor.setRecipients([account1, account2], [500n, 300n]);
      await tokenDistributor.connect(account1).claim({ from: account1.address });
      const balanceOf = await myToken.balanceOf(account1);
      expect(balanceOf).to.be.equal(500n);

      // 地址为测试网地址
      const web3 = new Web3("https://rpctest.filenova.org");
      let addressArray: string[] = [];
      let amountArray: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const account = web3.eth.accounts.create();
        addressArray.push(account.address);
        amountArray.push(i);
      }
      const totalClaimableBefore = await tokenDistributor.totalClaimable();
      console.log("totalClaimableBefore is:", totalClaimableBefore);
      const tx2 = await tokenDistributor.setRecipients(addressArray, amountArray, { gasLimit: 30000000n });
      const totalClaimable = await tokenDistributor.totalClaimable();
      console.log("totalClaimable is:", totalClaimable);
    });
  });
});
