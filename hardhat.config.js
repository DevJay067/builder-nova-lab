require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("solidity-coverage");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    // Local development network
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
    },

    // Ethereum Sepolia Testnet
    sepolia: {
      url:
        process.env.SEPOLIA_RPC_URL ||
        "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      chainId: 11155111,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
      gas: "auto",
    },

    // Polygon Mumbai Testnet
    polygonMumbai: {
      url:
        process.env.POLYGON_MUMBAI_RPC_URL ||
        "https://polygon-mumbai.g.alchemy.com/v2/YOUR-API-KEY",
      chainId: 80001,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
      gasPrice: 20000000000, // 20 gwei
    },

    // Polygon Mainnet
    polygon: {
      url:
        process.env.POLYGON_RPC_URL ||
        "https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      chainId: 137,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
    },

    // Ethereum Mainnet
    mainnet: {
      url:
        process.env.MAINNET_RPC_URL ||
        "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      chainId: 1,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
    },
  },

  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
    },
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 20, // gwei
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout: 40000,
  },
};
