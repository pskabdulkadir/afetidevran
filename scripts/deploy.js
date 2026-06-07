const hre = require("hardhat");

async function main() {
  console.log("=================================================");
  console.log("🚀 AFETİ DEVRAN V5 - POLYNOMIAL DEPLOYMENT ENGINE");
  console.log("=================================================");
  
  // Real Aave V3 Pool Addresses Provider on Polygon Mainnet
  const AAVE_POOL_ADDRESSES_PROVIDER = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb";

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📡 Deployer Address: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Wallet Balance: ${hre.ethers.formatEther(balance)} POL`);

  console.log("⏳ Compiling contracts and spinning up deployment transaction...");
  
  const AfetiDevranArbitrage = await hre.ethers.getContractFactory("AfetiDevranArbitrage");
  
  // Deploying the contract with Aave Addresses Provider constructor argument
  const contract = await AfetiDevranArbitrage.deploy(AAVE_POOL_ADDRESSES_PROVIDER);
  console.log("📨 Transaction broadcasted. Waiting for network confirmation...");
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n=================================================");
  console.log("🎯 DEPLOYMENT SUCCESSFULLY DECLARED AND VERIFIED!");
  console.log(`📍 AfetiDevranArbitrage deployed to: ${address}`);
  console.log("=================================================");
  console.log("👉 Copy this address and update CONTRACT_ADDRESS inside server.ts.");
  console.log("=================================================");
}

main().catch((error) => {
  console.error("\n❌ Critical error occured during deployment process:", error);
  process.exitCode = 1;
});
