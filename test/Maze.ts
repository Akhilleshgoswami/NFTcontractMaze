import hre from "hardhat";
import { ethers } from "hardhat"
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import  {  deployContracts,deployProxyContracts } from "./src/utils/common";
import { BASE_URI_TEST, CONTRACT_URI_TEST, MANAGER_ERROR_TEST, MARKETPLACE_ADDRESS_TEST, NEW_URI_TEST, NULL_ADDRESS_TEST, OPENSEA_PROXY_TEST, OWNER_ERROR_TEST, SUPPLY_CAP_TEST, SYMBOL_TEST, TOKEN_NAME_TEST } from "./src/utils/constant";

describe("Maze NFT work flow", () => {
  let signer: SignerWithAddress;
  let mazeGenZNFT: Contract;
  let mazeProxy: Contract;
  let admin: SignerWithAddress;
  let MazeProxyModule : Contract
  let user1:SignerWithAddress
  let proxy:Contract;
  before(async () => {
    // Get the signers (accounts) for testing
    [signer, admin,user1] = await ethers.getSigners();
    
    // Deploy the contracts using the deployContracts function
    mazeGenZNFT = await deployContracts("SD2023", signer)
    mazeProxy = await deployProxyContracts("MazeProxy",mazeGenZNFT.address,admin)
    // Assign a name tag for the contract address for tracing purposes
     MazeProxyModule = await ethers.getContractAt(
      "SD2023",
      mazeProxy.address
    );
    hre.tracer.nameTags[mazeProxy.address] = "Proxy Contract";
    
  });

  describe('Testing Contract functions', async () => {
  
    it("initialize",async()=>{

     await MazeProxyModule.initialize(TOKEN_NAME_TEST,SYMBOL_TEST,CONTRACT_URI_TEST,BASE_URI_TEST,SUPPLY_CAP_TEST,signer.address,signer.address,OPENSEA_PROXY_TEST);

    })
    // it("contract address", () => {
    //   // Log the contract address to the console
    //   console.log(MazeProxyModule.address)
    // })



    it("mint token ", async () => {
      // Mint tokens and verify the emitted event and token balance
      await expect(MazeProxyModule.safeMint(4)).emit(MazeProxyModule, "Mint").withArgs(signer.address, 4);
      let tokenBalance = await MazeProxyModule.balanceOf(signer.address);
      expect(tokenBalance).to.be.equal(4);
    })

    it("mint token with invalid number of token ", async () => {
      // Mint tokens and verify the emitted event and token balance
      await expect(MazeProxyModule.safeMint(14)).revertedWithCustomError(MazeProxyModule,"SupplyReachedAt").withArgs(18)
    })

    it("try to mint zero token", async () => {
      // Mint tokens and verify the emitted event and token balance
      await expect(MazeProxyModule.safeMint(0)).revertedWithCustomError(MazeProxyModule,"CanNotMintZeroNFT")
    })
    it("mint token without owner", async () => {
      // Mint tokens and verify the emitted event and token balance
      await expect(MazeProxyModule.connect(user1).safeMint(2)).rejectedWith(OWNER_ERROR_TEST)
    })
    it("add market place ", async () => {
      // Add a marketplace address and verify the emitted event
      await expect(MazeProxyModule.addMarketPlaceAddress(MARKETPLACE_ADDRESS_TEST)).emit(MazeProxyModule, "AddMarketPlace").withArgs(MARKETPLACE_ADDRESS_TEST);
    })
    it("add market place with not  as manager ", async () => {
      // Add a marketplace address and verify the emitted event
      await expect(MazeProxyModule.connect(user1).addMarketPlaceAddress(MARKETPLACE_ADDRESS_TEST)).rejectedWith(MANAGER_ERROR_TEST)
    })

    it("market Place Removed", async () => {
      // Remove a marketplace address and verify the emitted event
      await expect(MazeProxyModule.removeMarketPlaceAddress(MARKETPLACE_ADDRESS_TEST)).emit(MazeProxyModule, "RemovedMarketPlace").withArgs(MARKETPLACE_ADDRESS_TEST);
    })
    it("market Place Removed with null address", async () => {
      // Remove a marketplace address and verify the emitted event
      await expect(MazeProxyModule.removeMarketPlaceAddress(NULL_ADDRESS_TEST)).revertedWithCustomError(MazeProxyModule,"NullAddress")
    })
    it("market Place Removed without manager role", async () => {
      // Remove a marketplace address and verify the emitted event
      await expect(MazeProxyModule.connect(user1).removeMarketPlaceAddress(MARKETPLACE_ADDRESS_TEST)).rejectedWith(MANAGER_ERROR_TEST)
    })

    it("set new URI", async () => {
      // Set a new URI and verify the emitted event
      await expect(MazeProxyModule.setURI(NEW_URI_TEST)).emit(MazeProxyModule, "SetUri").withArgs(BASE_URI_TEST, NEW_URI_TEST);
    })
    it("set new URI with empty string", async () => {
      // Set a new URI and verify the emitted event
      await expect(MazeProxyModule.setURI("")).revertedWithCustomError(MazeProxyModule,"EmptyString")
    })


    it("pause contract", async () => {
      // Pause the contract
      await MazeProxyModule.pause()
    })

    it("mint token ", async () => {
      // Try to mint tokens while the contract is paused and expect it to be reverted with an error message
      await expect(MazeProxyModule.safeMint(5)).to.be.revertedWith("Pausable: paused")
    })

    it("unpause contract", async () => {
      // Unpause the contract
      await MazeProxyModule.unpause()
    })


    it("get token URI", async () => {
      // Get the token URI and compare it with the expected URI
      const tokenURI = await MazeProxyModule.tokenURI(1);
      expect(tokenURI).to.be.equal(`${NEW_URI_TEST}1.json`)
    })

    it("get token URI on invalid index", async () => {
      // Try to get the token URI for an invalid index and expect it to be reverted with an error message
      await expect(MazeProxyModule.tokenURI(18)).rejectedWith("ERC721: invalid token ID")
    })


    it("transfer token to other address", async () => {
      // Transfer a token from one address to another and verify the token balance of the receiving address
      await MazeProxyModule.transferFrom(signer.address, user1.address,1)
      let tokenBalance = await MazeProxyModule.balanceOf(user1.address);
      expect(tokenBalance).to.be.equal(1);
    })
  })
  // describe ("proxy upgrable" ,async()=>{
  //  it('deploy new impelementaion', async() => {
  //   mazeGenZNFT = await deployContracts("Akhilesh", signer)
  //  });
  //  it('load the proxy', async() => {
  //   proxy = await ethers.getContractAt(
  //     "ProxyInterface",
  //     mazeProxy.address
  //   );
  //  });
  //  it('Update the impelemention', async() => {
  //    await proxy.connect(admin).upgradeTo(mazeGenZNFT.address)
  //  });
  //  it('load the proxy contract', async() => {
  //   MazeProxyModule = await ethers.getContractAt(
  //     "Akhilesh",
  //     mazeProxy.address
  //   );
  //  });
  //  it('get the name', async() => {
  //   const data = await MazeProxyModule.getName();
  //  expect(data).to.be.equal("Akhilesh")
  //  });
  // })
});
