import hardhat from "hardhat";
const hre = hardhat;

async function main() {
  console.log("=================================================");
  console.log("🔍 NONCE SİNCRONİZASYON KONTROL");
  console.log("=================================================\n");

  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📡 Cüzdan Adresi: ${deployer.address}`);

    // Blockchain'deki geçerli nonce (onchain)
    const nonce = await deployer.getNonce();
    console.log(`✅ Blockchain Nonce: ${nonce}`);

    // Pending transaction count
    const txCount = await deployer.provider.getTransactionCount(deployer.address);
    console.log(`📊 Transaction Count: ${txCount}`);

    // Bakiye kontrolü
    const balance = await deployer.provider.getBalance(deployer.address);
    const balanceEth = hre.ethers.formatEther(balance);
    console.log(`💰 Cüzdan Bakiyesi: ${balanceEth} POL`);

    // Durum raporu
    console.log("\n=================================================");
    if (nonce === txCount) {
      console.log("✅ NONCE SİNCRON - Deploy'a hazır!");
    } else {
      console.log("⚠️ NONCE SINKRON DEĞİL!");
      console.log(`   Fark: ${Math.abs(nonce - txCount)}`);
      console.log(`   Çözüm: Pending transaction'ları bekle veya`);
      console.log(`          RPC tarafı değiştir (Alchemy vs Llamarpc)`);
    }

    if (parseFloat(balanceEth) < 0.1) {
      console.log("⚠️ UYARI: Cüzdan POL'ü çok az!");
      console.log("   Deploy için en az 0.1 POL gerekli");
    } else {
      console.log("✅ Cüzdan bakiyesi yeterli");
    }

    console.log("=================================================\n");

  } catch (error) {
    console.error("❌ Hata:", error.message);
    process.exitCode = 1;
  }
}

main();

export default main;
