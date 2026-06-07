const hre = require("hardhat");

async function main() {
  console.log("\n=================================================");
  console.log("🚀 AFETİ DEVRAN V5 - POLYGON MAINNET DEPLOYMENT");
  console.log("=================================================\n");

  // Aave V3 Polygon Address Provider (Mainnet)
  const AAVE_POOL_ADDRESSES_PROVIDER = "0xa97684ead0e402dC232d5A524153D7B0B733B4E3";
  
  console.log(`📍 Aave Provider: ${AAVE_POOL_ADDRESSES_PROVIDER}`);
  console.log(`🔗 Network: Polygon Mainnet`);
  console.log(`📡 RPC: ${process.env.POLYGON_ARCHIVE_URL || "https://polygon-rpc.com"}\n`);

  // Get signer
  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    console.error("❌ Hiçbir signer bulunamadı! PRIVATE_KEY .env'ye yazılı mı?\n");
    process.exit(1);
  }

  const [deployer] = signers;
  console.log(`👤 Deployer Address: ${deployer.address}`);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInPOL = hre.ethers.formatEther(balance);
  console.log(`💰 Cüzdan Bakiyesi: ${balanceInPOL} POL\n`);

  if (parseFloat(balanceInPOL) < 0.1) {
    console.warn("⚠️ UYARI: Cüzdanda en az 0.1 POL olmalı (gas için)\n");
  }

  console.log("⏳ Kontrat derleniyor...");
  
  // Get contract factory
  let AfetiDevranArbitrage;
  try {
    AfetiDevranArbitrage = await hre.ethers.getContractFactory("AfetiDevranArbitrage");
  } catch (err) {
    console.error("❌ Kontrat Factory hatası:", err.message);
    console.log("\n💡 Çözüm: Kontratı derle: npx hardhat compile");
    process.exit(1);
  }

  console.log("📝 Kontrat deploy ediliyor...\n");

  // Deploy contract
  let contract;
  try {
    contract = await AfetiDevranArbitrage.deploy(AAVE_POOL_ADDRESSES_PROVIDER);
    console.log(`📨 TX Hash: ${contract.deploymentTransaction()?.hash || "bilinmiyor"}`);
    console.log("⏳ Ağ onayı bekleniyor...");
    
    await contract.waitForDeployment();
  } catch (err) {
    console.error("❌ Deploy hatası:", err.message);
    if (err.message.includes("insufficient funds")) {
      console.log("\n💡 Çözüm: Cüzdanda POL bakiyesi yetersiz (gas için ~1 POL gerekli)");
    } else if (err.message.includes("Network error")) {
      console.log("\n💡 Çözüm: RPC bağlantısı başarısız. POLYGON_ARCHIVE_URL'yi kontrol et");
    }
    process.exit(1);
  }

  const contractAddress = await contract.getAddress();

  console.log("\n=================================================");
  console.log("✅ DEPLOYMENT BAŞARILI!");
  console.log("=================================================");
  console.log(`\n📍 Kontrat Adresi:\n   ${contractAddress}\n`);
  console.log("=================================================");
  console.log("⚡ ŞİMDİ YAPMAN GEREKEN:\n");
  console.log("1. .env dosyasını aç ve ekle:\n");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}\n`);
  console.log("2. Terminalde botun ana dosyasını çalıştır:\n");
  console.log("   npm run dev\n");
  console.log("3. http://localhost:5173 tarayıcıda aç\n");
  console.log("4. \"Otonom Akıllı Keşif\" checkbox'ını aç\n");
  console.log("=================================================\n");

  // Verify contract
  console.log("💡 İşlem sonrası kontratı doğrulamak isterseniz:");
  console.log(`   https://polygonscan.com/address/${contractAddress}\n`);
}

main().catch((error) => {
  console.error("\n❌ Deploy işlemi başarısız:", error.message);
  console.log("\nDetaylı hata:\n", error);
  process.exitCode = 1;
});
