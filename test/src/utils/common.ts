import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { Address } from "hardhat-deploy/types";
 const deployContracts = async (contractName: string, signer: Signer) => {
  const contract = await ethers.getContractFactory(contractName, signer);
  const deployedContract = await contract.deploy();
  return deployedContract;
};
 const deployProxyContracts = async (contractName:string,logic:Address,admin:SignerWithAddress,) => {
  const contract = await ethers.getContractFactory(contractName, admin);
  console.log(admin.getAddress);
  const deployedContract = await contract.deploy(logic,admin.address,"0x");
  
  return deployedContract;
}
export {deployContracts,deployProxyContracts}