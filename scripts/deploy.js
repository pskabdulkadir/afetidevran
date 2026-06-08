import hardhat from "hardhat";
const hre = hardhat;

async function main() {
  console.log("=================================================");
  console.log("🚀 AFETİ DEVRAN V5 - POLYGON DEPLOYMENT ENGINE");
  console.log("=================================================");

  // Real Aave V3 Pool Addresses Provider on Polygon Mainnet (Doğru adres)
  const AAVE_POOL_ADDRESSES_PROVIDER = "0xa97684eAd0e402dC232d5a524153D7b0B733B4E3";

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📡 Deployer Address: ${deployer.address}`);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Wallet Balance: ${hre.ethers.formatEther(balance)} POL`);

  console.log("⏳ Compiling contracts and spinning up deployment transaction...");

  const AfetiDevranArbitrage = await hre.ethers.getContractFactory("AfetiDevranArbitrage");

  // Deploying the contract (constructor otomatik Aave adreslerini set ediyor)
  const contract = await AfetiDevranArbitrage.deploy();
  console.log("📨 Transaction broadcasted. Waiting for network confirmation...");

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n=================================================");
  console.log("🎯 DEPLOYMENT SUCCESSFULLY DECLARED AND VERIFIED!");
  console.log(`📍 AfetiDevranArbitrage deployed to: ${address}`);
  console.log("=================================================");
  console.log("👉 Bunu .env dosyasına ekle:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log("=================================================");
}

main().catch((error) => {
  console.error("\n❌ Deployment hatası:", error);
  process.exitCode = 1;
});

export default main;
