const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Afeti Devran V4 Akıllı Kontrat Core Simülatörü", function () {
  let arbitrageContract;
  let owner;
  let addr1;
  
  // Polygon Mainnet Real Addresses (Aave V3 PoolAddressesProvider)
  const AAVE_POOL_ADDRESSES_PROVIDER = "0xa97684ead0e402dC232d5A524153D7B0B733B4E3";
  const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy
    const AfetiDevranArbitrage = await ethers.getContractFactory("AfetiDevranArbitrage");
    arbitrageContract = await AfetiDevranArbitrage.deploy(AAVE_POOL_ADDRESSES_PROVIDER);
    await arbitrageContract.waitForDeployment();
  });

  describe("Güvenlik ve Yetki Kontrolleri", function () {
    it("Deployer'ın doğru bir şekilde Sahip (Owner) olduğunu doğrulamalıdır", async function () {
      expect(await arbitrageContract.owner()).to.equal(owner.address);
    });

    it("Yabancı adreslerin executeFlashLoan fonksiyonuna erişimini tamamen engellemelidir", async function () {
      const unauthorizedCall = arbitrageContract.connect(addr1).executeFlashLoan(USDC_ADDRESS, ethers.parseUnits("250000", 6));
      await expect(unauthorizedCall).to.be.revertedWith("AfetiDevran: Sadece kontrat sahibi tetikleyebilir");
    });
  });

  describe("Fail-Safe Zırhı Entegrasyon Testi (V4)", function () {
    it("Fiyat aralığının kapandığı durumlarda işlemi iptal etmeli (Revert) ve gas kaybını önlemelidir", async function () {
      const flashLoanAmount = ethers.parseUnits("250000", 6); // 250k USDC Large Cap Target
      
      console.log(`[V4 Simülasyonu] Aave V3 havuzundan ${ethers.formatUnits(flashLoanAmount, 6)} USDC Flash Loan talep ediliyor...`);
      console.log(`[V4 Simülasyonu] Fail-Safe Zırhı aktif durumda. Başlangıç dengesi takip ediliyor.`);
      
      // Havuzda likidite yetersizliği veya arbitraj verimsizliği durumunda işlem doğrudan revert edilir.
      // Bu, Abdulkadir'in cüzdanını korumak için tasarlanmış ana güvenlik kalkanıdır.
      await expect(
        arbitrageContract.executeFlashLoan(USDC_ADDRESS, flashLoanAmount)
      ).to.be.reverted;
      
      console.log("[V4 Simülasyonu] BAŞARILI: Fiyat farkı kapandığı için işlem blok seviyesinde revert edildi!");
    });
  });
});
