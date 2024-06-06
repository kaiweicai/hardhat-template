/* eslint-disable prefer-const */
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { BigNumber } from "bignumber.js";
import { BN } from "bn.js";
import { expect } from "chai";
import exp from "constants";
import { ethers } from "hardhat";

const INITIAL_AMOUNT = new BigNumber("2100000000000000");
const PERCENT = 100;
const DENOMINATOR = 10000;

describe("AirDrop", function () {
  async function deployTokenFixture() {
    const [owner, account1, account2, account3, account4, account5] = await ethers.getSigners();
    const BTCF = await ethers.getContractFactory("BTCF");
    const btcf = await BTCF.deploy("BTCF token", "BTCF", INITIAL_AMOUNT.toNumber(), account3.address);
    await btcf.waitForDeployment();

    console.log("BTCF address: " + (await btcf.getAddress()));

    return { btcf, owner, account1, account2, account3, account4, account5 };
  }

  describe("test", function () {
    it("test init and transfer", async function () {
      const { btcf, owner, account1, account2, account3, account4 } = await loadFixture(deployTokenFixture);
      expect(await btcf.decimals()).to.be.equal(6);
      let btcfAddress = await btcf.getAddress();
      expect(await btcf.owner()).to.be.equal(owner.address);
      expect(await btcf.balanceOf(account3.address)).to.be.equal(INITIAL_AMOUNT);
      const transfer_amount = 10000;
      await btcf.connect(account3).transfer(account1, transfer_amount, { from: account3.address });
      expect(await btcf.balanceOf(account1)).to.be.equal((transfer_amount * (DENOMINATOR - PERCENT)) / DENOMINATOR);
      expect(await btcf.balanceOf(account3.address)).to.be.equal(
        INITIAL_AMOUNT.minus((transfer_amount * DENOMINATOR) / DENOMINATOR),
      );
      await btcf.setFeeReceiver(account2);
      const transferAccount3Amount = 1000;
      await btcf.connect(account3).transfer(account4, transferAccount3Amount, { from: account3.address });
      const receivedFee = await btcf.balanceOf(account2);
      expect(receivedFee).to.be.equal((transferAccount3Amount * PERCENT) / DENOMINATOR);
      await btcf.transferOwnership(account4.address);
      expect(await btcf.owner()).to.be.equal(account4.address);
    });

    it("test init and transferFrom", async function () {
      const { btcf, owner, account1, account2, account3, account4 } = await loadFixture(deployTokenFixture);
      expect(await btcf.decimals()).to.be.equal(6);
      expect(await btcf.owner()).to.be.equal(owner.address);
      expect(await btcf.balanceOf(account3.address)).to.be.equal(INITIAL_AMOUNT);
      const transfer_amount = 10000;
      await btcf.connect(account3).approve(account1.address, transfer_amount, { from: account3.address });
      await btcf.connect(account1).transferFrom(account3, account1, transfer_amount, { from: account1.address });
      expect(await btcf.balanceOf(account1)).to.be.equal((transfer_amount * (DENOMINATOR - PERCENT)) / DENOMINATOR);
      expect(await btcf.balanceOf(account3.address)).to.be.equal(
        INITIAL_AMOUNT.minus((transfer_amount * DENOMINATOR) / DENOMINATOR),
      );
      await btcf.setFeeReceiver(account2);
      const transferAccount3Amount = 1000;
      await btcf.connect(account3).approve(account1.address, transfer_amount, { from: account3.address });
      await btcf.connect(account1).transferFrom(account3, account4, transferAccount3Amount, { from: account1.address });
      const receivedFee = await btcf.balanceOf(account2);
      expect(receivedFee).to.be.equal((transferAccount3Amount * PERCENT) / DENOMINATOR);
      await btcf.transferOwnership(account4.address);
      expect(await btcf.owner()).to.be.equal(account4.address);
    });

    it("test init and whiteList", async function () {
      const { btcf, owner, account1, account2, account3, account4, account5 } = await loadFixture(deployTokenFixture);
      expect(await btcf.decimals()).to.be.equal(6);
      expect(await btcf.owner()).to.be.equal(owner.address);
      expect(await btcf.balanceOf(account3.address)).to.be.equal(INITIAL_AMOUNT);
      const transfer_amount = 10000;
      await btcf.connect(owner).setWhiteList(account3, true, { from: owner });
      await btcf.connect(account3).transfer(account1, transfer_amount, { from: account3.address });
      expect(await btcf.balanceOf(account1)).to.be.equal(transfer_amount);
      expect(await btcf.balanceOf(account3.address)).to.be.equal(INITIAL_AMOUNT.minus(transfer_amount));

      await btcf.setFeeReceiver(account2);
      const transferAccount3Amount = 1000;
      await btcf.connect(account3).transfer(account4, transferAccount3Amount, { from: account3.address });
      const receivedFee = await btcf.balanceOf(account2);
      expect(receivedFee).to.be.equal(0);

      const transfer_from_amount = 2309;
      await btcf.setWhiteList(account1, true);
      await btcf.connect(account3).approve(account1, transfer_from_amount, { from: account3 });
      await btcf.connect(account1).transferFrom(account3, account5, transfer_from_amount, { from: account1 });
      expect(await btcf.balanceOf(account5)).to.be.equal(transfer_from_amount);
    });
  });
});
