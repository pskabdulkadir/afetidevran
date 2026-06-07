require("hardhat/config");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      type: "http",
      url: "http://127.0.0.1:8545",
      forking: {
        url: process.env.POLYGON_ARCHIVE_URL || "https://polygon-rpc.com",
        blockNumber: 56000000
      }
    },
    polygon: {
      type: "http",
      url: process.env.POLYGON_ARCHIVE_URL || "https://polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
