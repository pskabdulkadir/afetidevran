import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

console.log("=================================================");
console.log("⚡ QUICK WATCHDOG TEST");
console.log("=================================================\n");

try {
  // Initialize
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_ARCHIVE_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("✅ Wallet initialized");
  console.log(`   Address: ${signer.address}`);

  // Get balance
  const balance = await provider.getBalance(signer.address);
  const balanceEth = ethers.formatEther(balance);
  console.log(`   Balance: ${balanceEth} POL\n`);

  // Test QuickSwap call
  const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
  const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

  const routerABI = [
    "function getAmountsOut(uint256 amountIn, address[] memory path) external view returns (uint256[] memory)",
  ];
  const router = new ethers.Contract(QUICKSWAP_ROUTER, routerABI, provider);

  console.log("📊 Testing market data fetch...");
  const amount = ethers.parseUnits("1000", 6);
  const pricesForward = await router.getAmountsOut(amount, [USDC, WETH]);
  const pricesBackward = await router.getAmountsOut(pricesForward[1], [WETH, USDC]);

  // Safe conversion
  const amountNum = Number(amount);
  const backwardNum = Number(pricesBackward[1]);
  const spread = ((backwardNum - amountNum) / amountNum) * 100;

  console.log(`✅ Market data fetched successfully`);
  console.log(`   USDC → WETH: ${pricesForward[1].toString()} wei`);
  console.log(`   WETH → USDC: ${pricesBackward[1].toString()} wei`);
  console.log(`   Spread: ${spread.toFixed(4)}%\n`);

  // Test contract initialization
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const ARBITRAGE_ABI = [
    "function executeMultiFlashLoan(address,uint256,address,uint256) external",
    "function updateSlippageTolerance(uint256) external",
  ];
  const contract = new ethers.Contract(contractAddress, ARBITRAGE_ABI, signer);

  console.log(`✅ Contract initialized`);
  console.log(`   Address: ${contractAddress}\n`);

  console.log("=================================================");
  console.log("✅ SYSTEM CHECK COMPLETE");
  console.log("=================================================\n");
  console.log("Ready to launch watchdog!\n");
  console.log("Command: node watchdog/autonomousWatchdog.js\n");

} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  console.error("\nDebug info:");
  if (error.message.includes("Cannot connect")) {
    console.error("→ RPC bağlantı sorunu. POLYGON_ARCHIVE_URL kontrol et");
  } else if (error.message.includes("BigInt")) {
    console.error("→ BigInt conversion sorunu");
  } else {
    console.error("→", error.message);
  }
  process.exit(1);
}
