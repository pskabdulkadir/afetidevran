import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

const POLYGON_RPC = process.env.POLYGON_ARCHIVE_URL || "https://polygon-rpc.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AAVE_POOL_PROVIDER = "0xa97684ead0e402dC232d5A524153D7B0B733B4E3";

// Read contract bytecode and ABI
const contractPath = path.join(process.cwd(), "contracts", "AfetiDevranArbitrage.sol");
const contractContent = fs.readFileSync(contractPath, "utf-8");

async function deploy() {
  console.log("=================================================");
  console.log("🚀 AFETİ DEVRAN V5 - DIRECT POLYGON DEPLOYMENT");
  console.log("=================================================");

  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(POLYGON_RPC, 137);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`📡 Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} POL`);

  if (parseFloat(ethers.formatEther(balance)) < 0.1) {
    console.error("❌ Insufficient balance for deployment gas");
    process.exit(1);
  }

  console.log("\n⏳ This deployment requires Hardhat compilation. Use:");
  console.log("   npx hardhat compile");
  console.log("\n   Then copy the bytecode and ABI from artifacts/");
  console.log("   OR use Remix IDE: https://remix.ethereum.org/");
  console.log("\n   Paste contract code and deploy with your wallet");

  // For now, just show the contract address that will be deployed
  console.log("\n=================================================");
  console.log("📍 CONTRACT DETAILS:");
  console.log(`   Constructor argument: ${AAVE_POOL_PROVIDER}`);
  console.log("=================================================");
  console.log("\n👉 QUICK FIX: Use Remix IDE");
  console.log("   1. Go to https://remix.ethereum.org/");
  console.log("   2. Create file > paste AfetiDevranArbitrage.sol");
  console.log("   3. Compile (select 0.8.20, enable optimization)");
  console.log("   4. Deploy to Polygon (connect MetaMask wallet)");
  console.log("   5. Copy deployed address to .env as CONTRACT_ADDRESS");
}

deploy().catch((e) => {
  console.error("❌ Deployment error:", e.message);
  process.exit(1);
});
