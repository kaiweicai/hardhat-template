/* eslint-disable prefer-const */
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { BigNumber } from "bignumber.js";
import { BN } from "bn.js";
import { expect } from "chai";
import exp from "constants";
import { ethers } from "hardhat";

const INITIAL_AMOUNT = new BigNumber("96000000000000000000");
const FIRST_GENERATION_RATE = 150;
const SECOND_GENERATION_RATE = 50;
const DIVISOR = 10000;
const MARKETING_WALLET_RATE = 200;
const LIQUIDITY_WALLET_RATE = 400;

//marketingWallet 0x6158DB1B8bAd110D928BBC6AdA2f99DD863EE899 2％,liquidityWallet 0x40C2A4625565951e5066fD3bc8D5CA2367773469 4％,mineWallet 0x9C75bB038571C3ec07Df20f22Cf505f7b8069075
// (一代1.5％，二代0.5％
describe("AirDrop", function () {
    async function deployTokenFixture() {
        const [user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet] = await ethers.getSigners();
        const TYTY = await ethers.getContractFactory("TYTY");
        const tyty = await TYTY.deploy("TYTY token", "TYTY", marketingWallet, liquidityWallet, mineWallet, INITIAL_AMOUNT.toString());
        await tyty.waitForDeployment();

        console.log("tyty address: " + (await tyty.getAddress()));

        return { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet };
    }


    describe("test", function () {
        it("test init and transfer", async function () {
            const { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet } = await loadFixture(deployTokenFixture);
            expect(await tyty.marketingWallet()).to.equal(marketingWallet.address);
        });

        it("Should set the correct liquidity wallet", async function () {
            const { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet } = await loadFixture(deployTokenFixture);
            expect(await tyty.liquidityWallet()).to.equal(liquidityWallet.address);
        });

        it("Should set the correct initial balance for the owner", async function () {
            const { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet } = await loadFixture(deployTokenFixture);
            expect((await tyty.balanceOf(mineWallet.address)).toString()).to.equal(INITIAL_AMOUNT);
        });
    });

    // describe("Set Manager", async function () {
    //     it("Should set the manager correctly", async function () {
    //         const { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet } = await loadFixture(deployTokenFixture);
    //         await tyty.connect(user3).setManager(manager.address);
    //         expect(await tyty.manager()).to.equal(manager.address);
    //     });

    //     it("Should only allow the owner to set the manager", async function () {
    //         const { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet } = await loadFixture(deployTokenFixture);
    //         // await tyty.connect(user1).setManager(manager.address);
    //         // await expect(tyty.connect(user1).setManager(manager.address)).to.be.revertedWithCustomError('OwnableUnauthorizedAccount("0xf9E02599e966126CE0f5913AcBD966C153Fd2A15")');
    //         await expect(tyty.connect(user1).setManager(manager.address)).to.be.reverted;
    //     });
    // });

    describe("Transfer", function () {
        it("Should transfer tokens and handle referrals correctly", async function () {
            const { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet } = await loadFixture(deployTokenFixture);
            // 初始余额检查
            let initialOwnerBalance = await tyty.balanceOf(mineWallet.address);
            let initialUser1Balance = await tyty.balanceOf(user1.address);

            let transferAmount = new BigNumber(100);
            // 转账
            await tyty.connect(mineWallet).transfer(user1.address, transferAmount.toNumber());

            // 检查余额变化
            let newOwnerBalance = await tyty.balanceOf(mineWallet.address);
            let newUser1Balance = await tyty.balanceOf(user1.address);



            // 计算各种奖励金额
            let marketingAmount = transferAmount.multipliedBy(MARKETING_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            let liquidityAmount = transferAmount.multipliedBy(LIQUIDITY_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            let firstGenerationAmount = transferAmount.multipliedBy(FIRST_GENERATION_RATE).dividedToIntegerBy(DIVISOR);
            let secondGenerationAmount = transferAmount.multipliedBy(SECOND_GENERATION_RATE).dividedToIntegerBy(DIVISOR);

            expect(newOwnerBalance).to.be.equal((new BigNumber(initialOwnerBalance.toString()).minus(transferAmount).plus(firstGenerationAmount)));
            expect(newUser1Balance).to.equal(new BigNumber(initialUser1Balance.toString()).plus(transferAmount).minus(marketingAmount).minus(liquidityAmount).minus(firstGenerationAmount));

            // 检查推荐关系
            expect(await tyty.referrals(user1.address)).to.equal(mineWallet.address);


            // 检查营销钱包和流动性钱包的余额
            let marketingWalletBalance = await tyty.balanceOf(marketingWallet.address);
            let liquidityWalletBalance = await tyty.balanceOf(liquidityWallet.address);

            expect(marketingWalletBalance).to.equal(marketingAmount);
            expect(liquidityWalletBalance).to.equal(liquidityAmount);

        });
    });

    // 转账两次
    describe("Transfer twice", function () {
        it("Should transfer tokens and handle referrals correctly", async function () {
            const { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet } = await loadFixture(deployTokenFixture);
            // 初始余额检查
            let initialOwnerBalance = await tyty.balanceOf(mineWallet.address);
            let initialUser1Balance = await tyty.balanceOf(user1.address);

            let transferAmount = new BigNumber(10000);
            // 转账
            await tyty.connect(mineWallet).transfer(user1.address, transferAmount.toNumber());

            // 检查余额变化
            let mineBalance = await tyty.balanceOf(mineWallet.address);
            let newUser1Balance = await tyty.balanceOf(user1.address);



            // 计算各种奖励金额
            let marketingAmount1 = transferAmount.multipliedBy(MARKETING_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            let liquidityAmount1 = transferAmount.multipliedBy(LIQUIDITY_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            let firstGenerationAmount = transferAmount.multipliedBy(FIRST_GENERATION_RATE).dividedToIntegerBy(DIVISOR);
            let secondGenerationAmount = transferAmount.multipliedBy(SECOND_GENERATION_RATE).dividedToIntegerBy(DIVISOR);

            expect(mineBalance).to.be.equal((new BigNumber(initialOwnerBalance.toString()).minus(transferAmount).plus(firstGenerationAmount).plus(secondGenerationAmount)));
            expect(newUser1Balance).to.equal(new BigNumber(initialUser1Balance.toString()).plus(transferAmount).minus(marketingAmount1).minus(liquidityAmount1).minus(firstGenerationAmount).minus(secondGenerationAmount));

            // 检查推荐关系
            expect(await tyty.referrals(user1.address)).to.equal(mineWallet.address);


            // 检查营销钱包和流动性钱包的余额
            let marketingWalletBalance = await tyty.balanceOf(marketingWallet.address);
            let liquidityWalletBalance = await tyty.balanceOf(liquidityWallet.address);

            expect(marketingWalletBalance).to.equal(marketingAmount1);
            expect(liquidityWalletBalance).to.equal(liquidityAmount1);



            // 第二次转账
            transferAmount = new BigNumber(8888);
            initialOwnerBalance = await tyty.balanceOf(mineWallet.address);
            initialUser1Balance = await tyty.balanceOf(user1.address);
            let initialUser2Balance = await tyty.balanceOf(user2.address);
            // 转账
            await tyty.connect(user1).transfer(user2.address, transferAmount.toNumber(), { from: user1 });

            // 检查余额变化
            mineBalance = await tyty.balanceOf(mineWallet.address);
            newUser1Balance = await tyty.balanceOf(user1.address);
            let newUser2Balance = await tyty.balanceOf(user2.address);

            console.log("newUser2Balance is:", newUser2Balance.toString());
            console.log("transferAmount is:", transferAmount.toString());
            // 计算各种奖励金额
            let marketingAmount2 = transferAmount.multipliedBy(MARKETING_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            console.log("marketingAmount2 is:", marketingAmount2.toString());
            let liquidityAmount2 = transferAmount.multipliedBy(LIQUIDITY_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            console.log("liquidityAmount2 is:", liquidityAmount2.toString());
            firstGenerationAmount = transferAmount.multipliedBy(FIRST_GENERATION_RATE).dividedToIntegerBy(DIVISOR);
            console.log("firstGenerationAmount is:", firstGenerationAmount.toString());
            secondGenerationAmount = transferAmount.multipliedBy(SECOND_GENERATION_RATE).dividedToIntegerBy(DIVISOR);
            console.log("secondGenerationAmount is:", secondGenerationAmount.toString());

            expect(mineBalance).to.be.equal((new BigNumber(initialOwnerBalance.toString()).plus(secondGenerationAmount)));
            expect(newUser1Balance).to.equal(new BigNumber(initialUser1Balance.toString()).minus(transferAmount).plus(firstGenerationAmount));
            expect(newUser2Balance).to.equal(new BigNumber(initialUser2Balance.toString()).plus(transferAmount).minus(marketingAmount2).minus(liquidityAmount2).minus(firstGenerationAmount).minus(secondGenerationAmount));

            // 检查推荐关系
            expect(await tyty.referrals(user1.address)).to.equal(mineWallet.address);
            expect(await tyty.referrals(user2.address)).to.equal(user1.address);


            // 检查营销钱包和流动性钱包的余额
            marketingWalletBalance = await tyty.balanceOf(marketingWallet.address);
            liquidityWalletBalance = await tyty.balanceOf(liquidityWallet.address);

            expect(marketingWalletBalance).to.equal(marketingAmount1.plus(marketingAmount2));
            expect(liquidityWalletBalance).to.equal(liquidityAmount1.plus(liquidityAmount2));
        });
    });

    // 转账三次
    describe("Transfer three times", function () {
        it("Should transfer tokens and handle referrals correctly", async function () {
            const { tyty, user3, user1, user2, marketingWallet, liquidityWallet, manager, mineWallet } = await loadFixture(deployTokenFixture);
            // 初始余额检查
            let initialOwnerBalance = await tyty.balanceOf(mineWallet.address);
            let initialUser1Balance = await tyty.balanceOf(user1.address);

            let transferAmount = new BigNumber(20000000000000000000);
            // 转账
            await tyty.connect(mineWallet).transfer(user1.address, transferAmount.toString());

            // 检查余额变化
            let mineBalance = await tyty.balanceOf(mineWallet.address);
            let newUser1Balance = await tyty.balanceOf(user1.address);



            // 计算各种奖励金额
            let marketingAmount1 = transferAmount.multipliedBy(MARKETING_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            let liquidityAmount1 = transferAmount.multipliedBy(LIQUIDITY_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            let firstGenerationAmount = transferAmount.multipliedBy(FIRST_GENERATION_RATE).dividedToIntegerBy(DIVISOR);
            let secondGenerationAmount = transferAmount.multipliedBy(SECOND_GENERATION_RATE).dividedToIntegerBy(DIVISOR);

            expect(mineBalance).to.be.equal((new BigNumber(initialOwnerBalance.toString()).minus(transferAmount).plus(firstGenerationAmount).plus(secondGenerationAmount)));
            expect(newUser1Balance).to.equal(new BigNumber(initialUser1Balance.toString()).plus(transferAmount).minus(marketingAmount1).minus(liquidityAmount1).minus(firstGenerationAmount).minus(secondGenerationAmount));

            // 检查推荐关系
            expect(await tyty.referrals(user1.address)).to.equal(mineWallet.address);


            // 检查营销钱包和流动性钱包的余额
            let marketingWalletBalance = await tyty.balanceOf(marketingWallet.address);
            let liquidityWalletBalance = await tyty.balanceOf(liquidityWallet.address);

            expect(marketingWalletBalance).to.equal(marketingAmount1);
            expect(liquidityWalletBalance).to.equal(liquidityAmount1);



            // 第二次转账
            transferAmount = new BigNumber(10000000000000000000);
            initialOwnerBalance = await tyty.balanceOf(mineWallet.address);
            initialUser1Balance = await tyty.balanceOf(user1.address);
            let initialUser2Balance = await tyty.balanceOf(user2.address);
            // 转账
            await tyty.connect(user1).transfer(user2.address, transferAmount.toString(), { from: user1 });

            // 检查余额变化
            mineBalance = await tyty.balanceOf(mineWallet.address);
            newUser1Balance = await tyty.balanceOf(user1.address);
            let newUser2Balance = await tyty.balanceOf(user2.address);

            console.log("newUser2Balance is:", newUser2Balance.toString());
            console.log("transferAmount is:", transferAmount.toString());
            // 计算各种奖励金额
            let marketingAmount2 = transferAmount.multipliedBy(MARKETING_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            console.log("marketingAmount2 is:", marketingAmount2.toString());
            let liquidityAmount2 = transferAmount.multipliedBy(LIQUIDITY_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            console.log("liquidityAmount2 is:", liquidityAmount2.toString());
            firstGenerationAmount = transferAmount.multipliedBy(FIRST_GENERATION_RATE).dividedToIntegerBy(DIVISOR);
            console.log("firstGenerationAmount is:", firstGenerationAmount.toString());
            secondGenerationAmount = transferAmount.multipliedBy(SECOND_GENERATION_RATE).dividedToIntegerBy(DIVISOR);
            console.log("secondGenerationAmount is:", secondGenerationAmount.toString());

            expect(mineBalance).to.be.equal((new BigNumber(initialOwnerBalance.toString()).plus(secondGenerationAmount)));
            expect(newUser1Balance).to.equal(new BigNumber(initialUser1Balance.toString()).minus(transferAmount).plus(firstGenerationAmount));
            expect(newUser2Balance).to.equal(new BigNumber(initialUser2Balance.toString()).plus(transferAmount).minus(marketingAmount2).minus(liquidityAmount2).minus(firstGenerationAmount).minus(secondGenerationAmount));

            // 检查推荐关系
            expect(await tyty.referrals(user1.address)).to.equal(mineWallet.address);
            expect(await tyty.referrals(user2.address)).to.equal(user1.address);


            // 检查营销钱包和流动性钱包的余额
            marketingWalletBalance = await tyty.balanceOf(marketingWallet.address);
            liquidityWalletBalance = await tyty.balanceOf(liquidityWallet.address);

            expect(marketingWalletBalance).to.equal(marketingAmount1.plus(marketingAmount2));
            expect(liquidityWalletBalance).to.equal(liquidityAmount1.plus(liquidityAmount2));

            // 第三次转账，从miner到user2
            transferAmount = new BigNumber(5000000000000000000);
            initialOwnerBalance = await tyty.balanceOf(mineWallet.address);
            initialUser1Balance = await tyty.balanceOf(user1.address);
            initialUser2Balance = await tyty.balanceOf(user2.address);
            // 转账
            await tyty.connect(mineWallet).transfer(user2.address, transferAmount.toString(), { from: mineWallet });

            // 检查余额变化
            mineBalance = await tyty.balanceOf(mineWallet.address);
            newUser1Balance = await tyty.balanceOf(user1.address);
            newUser2Balance = await tyty.balanceOf(user2.address);

            console.log("newUser2Balance is:", newUser2Balance.toString());
            console.log("transferAmount is:", transferAmount.toString());
            // 计算各种奖励金额
            let marketingAmount3 = transferAmount.multipliedBy(MARKETING_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            let liquidityAmount3 = transferAmount.multipliedBy(LIQUIDITY_WALLET_RATE).dividedToIntegerBy(DIVISOR);
            firstGenerationAmount = transferAmount.multipliedBy(FIRST_GENERATION_RATE).dividedToIntegerBy(DIVISOR);
            secondGenerationAmount = transferAmount.multipliedBy(SECOND_GENERATION_RATE).dividedToIntegerBy(DIVISOR);

            console.log("marketingAmount2 is:", marketingAmount2.toString());
            console.log("liquidityAmount2 is:", liquidityAmount2.toString());
            console.log("firstGenerationAmount is:", firstGenerationAmount.toString());
            console.log("secondGenerationAmount is:", secondGenerationAmount.toString());

            expect(mineBalance).to.be.equal((new BigNumber(initialOwnerBalance.toString()).minus(transferAmount).plus(secondGenerationAmount)));
            expect(newUser1Balance).to.equal(new BigNumber(initialUser1Balance.toString()).plus(firstGenerationAmount));
            expect(newUser2Balance).to.equal(new BigNumber(initialUser2Balance.toString()).plus(transferAmount).minus(marketingAmount3).minus(liquidityAmount3).minus(firstGenerationAmount).minus(secondGenerationAmount));

            // 检查推荐关系
            expect(await tyty.referrals(user1.address)).to.equal(mineWallet.address);
            expect(await tyty.referrals(user2.address)).to.equal(user1.address);


            // 检查营销钱包和流动性钱包的余额
            marketingWalletBalance = await tyty.balanceOf(marketingWallet.address);
            liquidityWalletBalance = await tyty.balanceOf(liquidityWallet.address);

            expect(marketingWalletBalance).to.equal(marketingAmount1.plus(marketingAmount2).plus(marketingAmount3));
            expect(liquidityWalletBalance).to.equal(liquidityAmount1.plus(liquidityAmount2).plus(liquidityAmount3));
        });
    });
});
