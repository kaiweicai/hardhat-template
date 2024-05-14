/* eslint-disable prefer-const */
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import exp from "constants";
import { ethers } from "hardhat";

const INITIAL_AMOUNT = 1000000;
const PERCENT = 1000;
const DENOMINATOR = 10000;

describe("AirDrop", function () {
  async function deployTokenFixture() {
    const [owner, account1, account2, account3] = await ethers.getSigners();
    const BTCF = await ethers.getContractFactory("BTCF");
    const btcf = await BTCF.deploy("BTCF token", "BTCF", INITIAL_AMOUNT);
    await btcf.waitForDeployment();

    console.log("BTCF address: " + (await btcf.getAddress()));

    return { btcf, owner, account1, account2, account3 };
  }

  describe("test", function () {
    it("test init", async function () {
      const { btcf, owner, account1, account2, account3 } = await loadFixture(deployTokenFixture);
      let btcfAddress = await btcf.getAddress();
      expect(await btcf.balanceOf(owner)).to.be.equal(INITIAL_AMOUNT);
      const transfer_amount = 10000;
      await btcf.transfer(account1, transfer_amount);
      expect(await btcf.balanceOf(account1)).to.be.equal((transfer_amount * (DENOMINATOR - PERCENT)) / DENOMINATOR);
      expect(await btcf.balanceOf(owner)).to.be.equal(
        INITIAL_AMOUNT - (transfer_amount * (DENOMINATOR - PERCENT)) / 10000,
      );
      await btcf.setFeeReceiver(account2);
      const transferAccount3Amount = 1000;
      await btcf.transfer(account3, transferAccount3Amount);
      const receivedFee = await btcf.balanceOf(account2);
      expect(receivedFee).to.be.equal((transferAccount3Amount * PERCENT) / DENOMINATOR);
    });
  });
});
