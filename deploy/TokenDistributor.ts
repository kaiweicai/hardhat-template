import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import contractABI from "../contracts/artifacts/TokenDistributor.json";
import { Address } from "../types";

const sweepReceiver: string = "0x1376Dd14c5Ae8dea2f44894A32C151EF7b88598d";
const delegateTo: string = "0x1376Dd14c5Ae8dea2f44894A32C151EF7b88598d";

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const myToken = await deploy("MyToken", {
    from: deployer,
    log: true,
  });
  console.log(`myToken contract: `, myToken.address);

  const myTokenContract = await hre.ethers.getContractAt("MyToken", myToken.address);
  // IERC20VotesUpgradeable _token,
  // address payable _sweepReceiver,
  // address _owner,
  // uint256 _claimPeriodStart,
  // uint256 _claimPeriodEnd,
  // address delegateTo

  const tokenDistributor = await deploy("TokenDistributor", {
    args: [myToken.address, sweepReceiver, deployer, 644904, 9999644904, delegateTo],
    from: deployer,
    log: true,
  });
  console.log(`tokenDistributor contract: `, tokenDistributor.address);

  const mintTx = await myTokenContract.mint(tokenDistributor.address, 1000000000000n);

  await sleep(10000);

  await myTokenContract.balanceOf(tokenDistributor.address).then((balanceOf) => {
    console.log("balanceOf is:", balanceOf);
  });

  console.log("mintTx hash :", mintTx.hash);

  // to set reception
  // 合约对象
  // const distributorContract = await hre.ethers.getContractAt("TokenDistributor", tokenDistributor.address);
  // console.log("获取 distributorContract");
  // const setRecipients = await distributorContract.setRecipients(
  //   ["0x48c7b1195a3775aAA0d41F0b64bfED0713d066ab", "0xfA9dcE7583225C0632dbaf774360A0E9a4727006"],
  //   [50000000n, 70000000n],
  // ); //合约的写方法，需要Signer
  // console.log("Trx hash:", setRecipients.hash);
};
export default func;
func.id = "deploy_lock"; // id required to prevent reexecution
func.tags = ["Lock"];
