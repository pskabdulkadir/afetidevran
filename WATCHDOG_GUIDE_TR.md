# 🤖 AfetiDevran V5 - Autonomous Self-Healing Watchdog

## Genel Bakış

Bu sistem üç katmandan oluşur:

1. **Smart Contract** (Solidity) - Dinamik parametreler ve event log'ları
2. **Watchdog Bot** (Node.js) - 24/7 izleme ve otomatik onarım
3. **Dashboard** (HTTP API) - Real-time raporlama

---

## Sistem Nasıl Çalışır?

### Döngü 1: Market Monitoring (30 saniye)
```
┌─────────────────────────────────┐
│ Piyasa verilerini topla          │
│ (QuickSwap + SushiSwap fiyat)    │
│ Spread % hesapla                │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ Spread > 0.3% mi?               │
└──────────┬──────────────────────┘
           │
           └─→ EVET → Fork simulation
           └─→ HAYIR → Bekle
```

### Döngü 2: Error Analysis (Real-time)
```
┌─────────────────────────────────┐
│ Kontrat error event dinle        │
│ (FailureLogged)                 │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ Hata tipini sınıflandır:         │
│ • Slippage hatası?              │
│ • Liquidity hatası?             │
│ • Gas hata?                     │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ AI ile çözüm öner:               │
│ • Parametreleri güncelle        │
│ • Fork'ta test et               │
│ • Mainnet'te uygula             │
└─────────────────────────────────┘
```

---

## Kurulum Adımları

### 1. Watchdog Bağımlılıklarını Kur
```bash
npm install
```

### 2. .env'de Watchdog Adresi Ekle
```bash
# .env'ye ekle:
WATCHDOG_ENABLED=true
```

### 3. Kontratı Güncelle (Deploy et)

Eğer kontrat zaten deploy'lanmışsa, watchdog adresini set et:

```bash
npx hardhat run scripts/setWatchdog.js --network polygon
```

**scripts/setWatchdog.js:**
```javascript
import hardhat from "hardhat";
const hre = hardhat;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt(
    "AfetiDevranArbitrage",
    process.env.CONTRACT_ADDRESS
  );

  // Watchdog adresi = deployer adresi
  const tx = await contract.setWatchdogAddress(deployer.address);
  await tx.wait();
  console.log("✅ Watchdog address set!");
}

main().catch(console.error);
```

### 4. Watchdog'u Başlat
```bash
node watchdog/autonomousWatchdog.js
```

**Beklenen çıktı:**
```
🤖 Autonomous Watchdog Initialized
📡 Monitoring: 0x...
🚀 Starting autonomous monitoring...
📊 Market Data: Spread = 0.4521%
```

### 5. Dashboard Aç (Opsiyonel)
Başka bir terminal'de:
```bash
curl http://localhost:3001/report
```

**Çıktı (JSON):**
```json
{
  "timestamp": "2024-06-08T...",
  "market": {
    "spread": "0.4521%",
    "lastUpdate": 1717873200000,
    "usdcWethPrice": "1234567890123456",
    "wethUsdcPrice": "1234567890123456"
  },
  "parameters": {
    "slippageTolerance": 995,
    "minProfit": 100,
    "borrowAmount": "10000000000"
  },
  "errors": {
    "Insufficient spread": 2,
    "Slippage exceeded": 1
  },
  "status": "Monitoring Active"
}
```

---

## Otomatik Onarım Özellikleri

### Özellik 1: Dinamik Slippage Ayarı
```
Hata: "Slippage exceeded"
└─→ AI çözüm: Slippage'ı %0.5'ten %1'e çıkar
└─→ Fork'ta test: ✅ Başarılı
└─→ Mainnet'te uygula: updateSlippageTolerance(990)
```

### Özellik 2: Minimum Profit Eşiği
```
Hata: "Profit too low relative to gas cost"
└─→ AI çözüm: Min profit eşiğini düşür (100 → 50)
└─→ Fork'ta test: ✅ Başarılı
└─→ Mainnet'te uygula: updateMinProfit(50)
```

### Özellik 3: Market Data Logging
```
Watchdog her 30 saniyede bir:
• QuickSwap USDC/WETH fiyatını sorguluyor
• SushiSwap WETH/USDC fiyatını sorguluyor
• Spread %'ini hesaplıyor
• Kontrata event olarak gönderiyor
```

---

## Hata Giderme

### Hata 1: "Cannot connect to polygon network"
```bash
# Çözüm: RPC URL'yi kontrol et
echo $POLYGON_ARCHIVE_URL
# Çıktı: https://polygon-mainnet.g.alchemy.com/v2/...
```

### Hata 2: "Watchdog address not set"
```bash
# Çözüm: setWatchdog.js'i çalıştır
npx hardhat run scripts/setWatchdog.js --network polygon
```

### Hata 3: "Fork simulation failed"
```bash
# Çözüm: Hardhat node'u başlat (opsiyonel)
npx hardhat node --fork https://polygon.llamarpc.com
```

---

## Produksiyonda Çalıştırma (24/7)

### Option 1: PM2 (Node.js Process Manager)
```bash
npm install -g pm2
pm2 start watchdog/autonomousWatchdog.js --name "afetidevran-watchdog"
pm2 save
pm2 startup
```

### Option 2: Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "watchdog/autonomousWatchdog.js"]
```

```bash
docker build -t afetidevran-watchdog .
docker run -d --env-file .env afetidevran-watchdog
```

### Option 3: Render/Heroku
`.env` dosyasını güvenli bir şekilde platform'a yükle:
```bash
# Render CLI
render deploy --env-file .env
```

---

## Sistem Limitleri (ÖNEMLI)

Yapay zeka hatayı çözemediği durumlar:

### 1. Flash Crash
```
Senaryo: Aave havuzundaki likidite aniden 0 olur
Sonuç: Tüm işlemler revert olur
AI çözümü: YOKTUR (piyasa durması)
Watchdog tepkisi: Kill Switch'i aç, paranı koru
```

### 2. MEV Saldırısı
```
Senaryo: Front-runner bot, senden daha iyi fiyat al
Sonuç: Spread kaybolur
AI çözümü: Özel RPC kullan (MEV_PRIVATE_RELAY=true)
Watchdog tepkisi: İşlemi sonraki bloğa ertele
```

### 3. Network Kesintisi
```
Senaryo: Polygon RPC offline
Sonuç: Watchdog'un bağlantı yok
AI çözümü: Fallback RPC'ye geç
Watchdog tepkisi: Backup RPC listesini dene
```

---

## Performance Metrics

Watchdog 30 dakikada:
- ✅ 60 piyasa veri ölçümü
- ✅ 5-10 error analiz
- ✅ 2-3 fork simulation
- ✅ 1-2 parameter update

**CPU:** ~15-20%  
**Memory:** ~200-300 MB  
**Network:** ~50-100 MB/gün

---

## İleri Konfigürasyon

### Custom Error Handlers
`watchdog/autonomousWatchdog.js` içinde `generateAISolution()` fonksiyonunu düzenle:

```javascript
const solutions = {
  "Custom Error Message": {
    action: "Your custom action",
    parameter: "parameter_name",
    newValue: "new_value",
  }
};
```

### Claude AI Entegrasyonu (Optional)
```javascript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function generateAISolution(errorMsg) {
  const response = await client.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `DeFi arbitrage hatası: "${errorMsg}". Çözümü ne olmalı?`
      }
    ]
  });
  return response.content[0].text;
}
```

---

## Genel Akış Şeması

```
┌─────────────────────────────────────────┐
│   AUTONOMOUS ARBITRAGE SYSTEM           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ SMART CONTRACT (Solidity)        │  │
│  │ • executeMultiFlashLoan()        │  │
│  │ • Dynamic Parameters             │  │
│  │ • Event Logging                  │  │
│  └────────────────┬─────────────────┘  │
│                   │                     │
│                   ↓                     │
│  ┌──────────────────────────────────┐  │
│  │ WATCHDOG BOT (Node.js)           │  │
│  │ • Market Monitoring              │  │
│  │ • Error Analysis                 │  │
│  │ • Auto Repair                    │  │
│  └────────────────┬─────────────────┘  │
│                   │                     │
│    ┌──────────────┼──────────────┐     │
│    ↓              ↓              ↓     │
│  Fork Sim    API Report   Telegram Alert│
│    (Test)    (HTTP 3001)   (Optional)  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Başarı Örneği (Use Case)

```
T+00:00 - Watchdog başlar
T+00:30 - Market data: USDC/WETH spread = 0.42%
T+00:35 - Fork simulation: ✅ Başarılı
T+00:40 - Flash loan işlemi: ✅ $2,500 kâr
T+02:15 - Hata: "Slippage exceeded"
T+02:16 - AI çözüm: Slippage 995 → 990 güncelle
T+02:17 - Fork test: ✅ Başarılı
T+02:18 - Mainnet güncelle: updateSlippageTolerance(990)
T+02:25 - Tekrar işlem: ✅ $1,800 kâr
T+04:00 - Dashboard raporu: 2 işlem, $4,300 toplam kâr
```

---

**Hazırsın! Watchdog'u çalıştırabilirsin!** 🚀

```bash
npm install
node watchdog/autonomousWatchdog.js
```

---

**Not:** Sistem hala insan denetimi altında kalmalı. Haftalık raporlar ve audit'ler önemlidir.
