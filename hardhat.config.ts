import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "hardhat-tracer";
import "hardhat-deploy";
import { HttpNetworkUserConfig } from "hardhat/types";
import "hardhat-storage-layout";
import "hardhat-storage-layout-changes";
dotenv.config({ path: __dirname + "/.env" });

const DEFAULT_MNEMONIC: string = process.env.MNEMONIC || "";

const sharedNetworkConfig: HttpNetworkUserConfig = {
  live: true,
  saveDeployments: true,
  timeout: 8000000,
  gasPrice: "auto",
};

if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY_2) {
  sharedNetworkConfig.accounts = [process.env.PRIVATE_KEY,process.env.PRIVATE_KEY_2];
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: process.env.MNEMONIC || DEFAULT_MNEMONIC,
  };
}
export default {
  namedAccounts: {
    deployer: 1,
  },
  paths: {
    tests: "./test",
    cache: "./cache",
    deploy: "./src/deploy",
    sources: "./contracts",
    deployments: "./deployments",
    artifacts: "./artifacts",
    storageLayouts: ".storage-layouts",

    
  },
  storageLayoutConfig: {
    contracts: ["MazeNFT"],
    fullPath: false
  },

  solidity: {
    compilers: [
      {
        version: "0.8.18",
        settings: {
          optimizer: {
            runs: 200,
            enabled: true,
          },
          "outputSelection": {
            "*": {
              "*": [
                "metadata", "evm.bytecode" // Enable the metadata and bytecode outputs of every single contract.
                , "evm.bytecode.sourceMap", // Enable the source map output of every single contract.
                "storageLayout"
              ],
              "": [
                "ast" // Enable the AST output of every single file.
              ]
            },
          },
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: {
        accountsBalance: "100000000000000000000000000000000000000000",
        accounts: process.env.PRIVATE_KEY || DEFAULT_MNEMONIC,
      },
    },
    arbitrum_goerli: {
      ...sharedNetworkConfig,
      url: `https://arb-goerli.g.alchemy.com/v2/${process.env.INFURA_KEY}`,
    }, polygon_mumbai: {
      ...sharedNetworkConfig,
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.INFURA_KEY}`,
    },
    polygon: {
      ...sharedNetworkConfig,
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.INFURA_KEY}`,
    },
  },
  etherscan: {
    apiKey: process.env.POLYGON_API_KEY,
  },
  watcher: {
    /* run npx hardhat watch compilation */
    compilation: {
      tasks: ["compile"],
      verbose: true,
    },
  },
  mocha: {
    timeout: 8000000,
  },
  test: {
    tasks: [
      {
        commond: "test",
        params: {
          logs: true,
          noCompile: false,
          testFiles: ["./test/src/maze.test.ts"],
        },
      },
    ],
    files: ["./test/src/*"],
    verbose: true,
  },
  ci: {
    tasks: [
      "clean",
      { command: "compile", params: { quiet: true } },
      {
        command: "test",
        params: {
          noCompile: true,
          testFiles: ["./test/src/maze.ts"],
        },
      },
    ],
  },

  //  shows gas in tables
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 10,
  },
};
