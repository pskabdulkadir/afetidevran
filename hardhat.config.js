/**
 * @type {import('hardhat/config').HardhatUserConfig}
 * @dev Hardhat configuration file to spin up a Polygon Mainnet forking node.
 * Enables zero-risk arbitrage simulation with live liquidity.
 */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      forking: {
        // High-availability public Polygon Mainnet RPC node or customized provider (Alchemy, Infura, etc.)
        url: process.env.POLYGON_ARCHIVE_URL || "https://polygon-rpc.com",
        // Stable historical lock block to ensure repeatable test environments
        blockNumber: 56000000
      }
    },
    polygon: {
      url: "https://polygon-rpc.com", // Deploy için stabil ana ağ RPC'si
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [] // Render environment variables'dan gelecek gizli anahtar
    }
  }
};
