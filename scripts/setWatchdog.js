import hardhat from "hardhat";
const hre = hardhat;

async function main() {
  console.log("=================================================");
  console.log("🤖 SETTING WATCHDOG ADDRESS");
  console.log("=================================================\n");

  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📡 Deployer Address: ${deployer.address}`);

    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("CONTRACT_ADDRESS not set in .env");
    }

    const contract = await hre.ethers.getContractAt(
      "AfetiDevranArbitrage",
      contractAddress
    );

    console.log(`\n⏳ Setting watchdog to: ${deployer.address}`);
    const tx = await contract.setWatchdogAddress(deployer.address);
    console.log(`📨 Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed!`);
    console.log(`\n=================================================`);
    console.log(`🎯 WATCHDOG SET SUCCESSFULLY!`);
    console.log(`=================================================`);
    console.log(`\nWatchdog can now:`);
    console.log(`  • updateSlippageTolerance()`);
    console.log(`  • updateMinProfit()`);
    console.log(`  • captureMarketData()`);
    console.log(`  • logError()`);
    console.log(`\n✅ Ready to run watchdog bot!`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exitCode = 1;
  }
}

main();

export default main;
