import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AAVE_POOL_PROVIDER = "0xa97684ead0e402dC232d5A524153D7B0B733B4E3";
const RPC_URL = process.env.POLYGON_ARCHIVE_URL || "https://polygon-rpc.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function deploy() {
  console.log("\n=================================================");
  console.log("🚀 AFETİ DEVRAN V5 - POLYGON DEPLOYMENT (ETHERS.JS)");
  console.log("=================================================\n");

  // Validasyon
  if (!PRIVATE_KEY || PRIVATE_KEY.trim() === "") {
    console.error("❌ HATA: PRIVATE_KEY .env dosyasında tanımlı değil!");
    console.log("\n💡 Çözüm: .env dosyasına ekle:");
    console.log("   PRIVATE_KEY=your_private_key_here\n");
    process.exit(1);
  }

  // Provider ve Wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL, 137);
  const cleanKey = PRIVATE_KEY.trim().startsWith("0x") ? PRIVATE_KEY.trim() : `0x${PRIVATE_KEY.trim()}`;
  const wallet = new ethers.Wallet(cleanKey, provider);

  console.log(`📍 RPC URL: ${RPC_URL}`);
  console.log(`👤 Deployer: ${wallet.address}`);

  // Bakiye kontrol
  const balance = await provider.getBalance(wallet.address);
  const balanceInPOL = ethers.formatEther(balance);
  console.log(`💰 Bakiye: ${balanceInPOL} POL\n`);

  if (parseFloat(balanceInPOL) < 0.1) {
    console.error("❌ HATA: Cüzdanda yeterli POL yok (en az 0.1 POL gerekli)!");
    console.log(`   Mevcut: ${balanceInPOL} POL\n`);
    process.exit(1);
  }

  // Solidity kodunu oku
  const contractPath = path.join(__dirname, "contracts", "AfetiDevranArbitrage.sol");
  
  if (!fs.existsSync(contractPath)) {
    console.error(`❌ HATA: Kontrat dosyası bulunamadı: ${contractPath}\n`);
    process.exit(1);
  }

  console.log("⏳ Kontrat derleniyor (solc)...");
  console.log(`📝 Dosya: ${contractPath}\n`);

  // JSON ABI - AfetiDevranArbitrage kontratı
  const contractABI = [
    "constructor(address _addressesProvider)"
  ];

  // Bytecode - derleme için gerekli
  // Bu değeri `npx hardhat compile` sonrası artifacts klasöründen alırız
  // Veya Remix IDE'de derledikten sonra bytecode'u kopyalarız
  
  console.log("💡 Deploy işlemi için 3 seçenek:\n");
  console.log("SEÇENEK 1: Hardhat Compile (Önerilir)");
  console.log("   $ npx hardhat compile");
  console.log("   Ardından artifacts/contracts/ klasöründen bytecode'u al\n");

  console.log("SEÇENEK 2: Remix IDE");
  console.log("   https://remix.ethereum.org/ açıp kontratı derle\n");

  console.log("SEÇENEK 3: Bu script'i elle bytecode ile çalıştır");
  console.log("   Bytecode'u buraya yapıştır\n");

  console.log("=================================================");
  console.log("❌ Bytecode bulunamadı!\n");
  console.log("💡 Çözüm: Hardhat ile derle:");
  console.log("   npx hardhat compile --config hardhat.config.cjs\n");
  console.log("Ardından şu komutu çalıştır:");
  console.log("   node deploy-with-bytecode.js\n");
  console.log("=================================================\n");

  // Artifacts klasöründen bytecode'u otomatik yükle
  const artifactsPath = path.join(__dirname, "artifacts", "contracts", "AfetiDevranArbitrage.sol", "AfetiDevranArbitrage.json");
  
  if (fs.existsSync(artifactsPath)) {
    console.log("✅ Artifacts dosyası bulundu! Deploy başlatılıyor...\n");
    
    const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf-8"));
    const bytecode = artifact.bytecode;
    const abi = artifact.abi;

    if (!bytecode || bytecode === "0x") {
      console.error("❌ HATA: Bytecode boş! Kontratı derle:");
      console.log("   npx hardhat compile --config hardhat.config.cjs\n");
      process.exit(1);
    }

    // Deploy
    try {
      console.log("📝 Kontrat factory oluşturuluyor...");
      const factory = new ethers.ContractFactory(abi, bytecode, wallet);
      
      console.log("🚀 Deploy TX'i gönderiliyor...");
      const contract = await factory.deploy(AAVE_POOL_PROVIDER);
      
      console.log(`📨 TX Hash: ${contract.deploymentTransaction()?.hash}\n`);
      console.log("⏳ Ağ onayı bekleniyor (bu 30-60 saniye alabilir)...\n");
      
      const receipt = await contract.deploymentTransaction()?.wait(1);
      
      const contractAddress = await contract.getAddress();

      console.log("\n=================================================");
      console.log("✅ DEPLOYMENT BAŞARILI!");
      console.log("=================================================\n");
      console.log(`📍 Kontrat Adresi:\n   ${contractAddress}\n`);
      console.log(`📊 TX Hash:\n   ${receipt?.hash}\n`);
      console.log("=================================================");
      console.log("⚡ ŞİMDİ YAPMAN GEREKEN:\n");
      console.log("1. .env dosyasını aç ve ekle:\n");
      console.log(`   CONTRACT_ADDRESS=${contractAddress}\n`);
      console.log("2. Botun ana dosyasını çalıştır:\n");
      console.log("   npm run dev\n");
      console.log("3. http://localhost:5173 tarayıcıda aç\n");
      console.log("4. \"Otonom Akıllı Keşif\" checkbox'ını aç\n");
      console.log("=================================================\n");
      console.log("🔍 Kontratı PolygonScan'de görmek için:\n");
      console.log(`   https://polygonscan.com/address/${contractAddress}\n`);

    } catch (err) {
      console.error("❌ Deploy hatası:", err.message);
      if (err.message.includes("insufficient funds")) {
        console.log("\n💡 Çözüm: Cüzdan bakiyesi yetersiz. En az 0.1 POL gerekli.");
      } else if (err.message.includes("invalid bytecode")) {
        console.log("\n💡 Çözüm: Bytecode hatalı. Kontratı yeniden derle.");
      }
      process.exit(1);
    }

  } else {
    console.log("⚠️  Artifacts klasörü bulunamadı!");
    console.log("   Hardhat ile derle: npx hardhat compile --config hardhat.config.cjs\n");
    process.exit(1);
  }
}

deploy().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
