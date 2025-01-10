import { ethers } from "hardhat";
import hre from "hardhat";

async function deployProxy() {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const Box = await ethers.getContractFactory("Box");

  const box = await deploy("Box", {
    from: deployer,
  });

  const proxy = await deploy("UUPSProxy", {
    from: deployer,
    args: [box.address, Box.interface.encodeFunctionData("initialize")],
    log: true,
  });

  console.log("box contract address", box.address);
  console.log(`proxy contract: `, proxy.address);
}

deployProxy().catch(console.error);
