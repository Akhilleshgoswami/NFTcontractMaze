import { ethers } from "hardhat";
import {  DeployFunction, Deployment } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { contractNames } from "../ts/deploy";


import verifyContract from "../utilites/utilites";
import { BASE_URI, CONTRACT_URI, OPENSEA_PROXY, SUPPLY_CAP, SYMBOL, TOKEN_NAME } from "../utilites/constants";
const deployContract: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments } = hre;
  const { deploy, get } = deployments;
  const { GenZNFT, MazeProxy } = contractNames;
  let MazeNFT: Deployment;
  let MazeProxys: Deployment;

  let [deployer,signer] = await hre.ethers.getSigners();

  console.table({
    deployer: deployer.address,
    signer: signer.address,
  });

  const chainId = await hre.getChainId();
  console.log("chainId: ", chainId);

  // Step-02 Deploy Cruize Implementation Contract
  await deploy(GenZNFT, {
    from: deployer.address,
    args: [],
    log: true,
    deterministicDeployment: false,
  });
  MazeNFT = await get(GenZNFT);
  console.log("MazeNFT", MazeNFT.address);

  // Step-03 Deploy  Proxy Contract
  await deploy(MazeProxy, {
    from: deployer.address,
    args: [MazeNFT.address, deployer.address, "0x"],
    log: true,
    deterministicDeployment: false,
  });
  MazeProxys = await get(MazeProxy);

  console.table({
    MazeNFTImplementation: MazeNFT.address,
    MazeProxy: MazeProxys.address,
  }); 
  const MazeModuleProxy = await ethers.getContractAt(
    "SD2023",
    MazeProxys.address,
    deployer
  );
const data =  await MazeModuleProxy.connect(signer).initialize(TOKEN_NAME,SYMBOL,CONTRACT_URI,BASE_URI,SUPPLY_CAP,signer.address,signer.address,OPENSEA_PROXY)
console.log(data)
  // console.log(await MazeNFT.methods.owner().call()) 

  await verifyContract(hre, MazeProxys.address, [
    MazeNFT.address,
    deployer.address,
    "0x",
  ],
  `contracts/proxy/MazeProxy.sol:MazeProxy`
  );
  await verifyContract(hre, MazeNFT.address, [],  `contracts/MazeNFT.sol:${GenZNFT}`);
};

export default deployContract;
