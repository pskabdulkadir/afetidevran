# ⚡ Hızlı Başlangıç - Autonomous Watchdog

## ✅ SYSTEM READY

Tüm bağımlılıklar yüklü ve hazır!

```
✅ ethers.js
✅ express.js  
✅ dotenv
✅ Polygon RPC bağlantısı
✅ Smart Contract address
```

---

## 🚀 3 Adımla Başlat

### Adım 1: System Check (Opsiyonel)
```bash
node watchdog/simple-test.js
```

Beklenen çıktı:
```
✅ Environment Variables: SET
✅ Module Imports: OK
📝 STATUS: Ready for watchdog launch
```

### Adım 2: Watchdog'u Başlat
```bash
node watchdog/autonomousWatchdog.js
```

Beklenen çıktı:
```
=================================================
🤖 AUTONOMOUS WATCHDOG SYSTEM
=================================================

✅ Watchdog initialized successfully
🚀 Starting autonomous monitoring...

📊 Capturing market data...
📊 Market Data: Spread = 0.4521%

📊 Dashboard running on http://localhost:3001/report
💚 Health check: http://localhost:3001/health
```

**ÖNEMLİ:** Bu terminal'i açık tutun! (Watchdog 24/7 çalışıyor)

### Adım 3: Dashboard Kontrolü (Başka Terminal)
```bash
# Health check
curl http://localhost:3001/health

# Full report
curl http://localhost:3001/report
```

Beklenen çıktı:
```json
{
  "timestamp": "2024-06-08T...",
  "market": {
    "spread": "0.4521%",
    "lastUpdate": 1717873200000
  },
  "parameters": {
    "slippageTolerance": 995,
    "minProfit": 100
  },
  "status": "Monitoring Active",
  "uptime": 120.5
}
```

---

## 📊 Watchdog Neler Yapıyor?

### Otomatik İşlemler (Her 30 saniye)
```
1. QuickSwap USDC/WETH fiyatını kontrol
2. SushiSwap WETH/USDC fiyatını kontrol
3. Spread % hesapla
4. Kontrata piyasa verisini gönder
5. Kâr fırsatını analiz et
```

### Hata Yönetimi (Real-time)
```
Kontrat error emit ederse:
1. Hata tipini tanı
2. AI çözümü öner
3. Parametreleri güncelle
4. Sonucu raporla
```

### Dashboard API
```
GET /report     → Tam raporun JSON formatında
GET /health     → Watchdog sağlık durumu
```

---

## 🔧 Sorun Giderme

### Sorun 1: "Cannot connect to polygon network"
```bash
# .env'de POLYGON_ARCHIVE_URL'yi kontrol et
echo %POLYGON_ARCHIVE_URL%

# Çıktı olmalı:
# https://polygon-mainnet.g.alchemy.com/v2/...
```

### Sorun 2: "Contract address not set"
```bash
# .env'ye ekle:
CONTRACT_ADDRESS=0x... (deploy'dan kopyala)
```

### Sorun 3: Dashboard bağlanamıyor (localhost:3001)
```bash
# Başka bir PORT kullan
PORT=3002 node watchdog/autonomousWatchdog.js

# Veya watchdog'u kontrol et (çalışıyor mu?)
curl http://localhost:3001/health
```

---

## 💾 Watchdog Dosya Yapısı

```
watchdog/
├── autonomousWatchdog.js     ← Ana watchdog bot
├── simple-test.js             ← System check script
└── README.md (varsa)
```

---

## 📈 Beklenen Akış

```
T+00:00 ─ Watchdog başlar
T+00:30 ─ İlk market data: Spread = 0.45%
T+01:00 ─ İkinci market data: Spread = 0.52% (↑ KÂRLI!)
T+05:00 ─ Spread > 0.3%: Fırsatı report'a yaz
T+30:00 ─ Dashboard çek: 5 dakikalık ortalama spread = 0.48%
T+60:00 ─ Hata log'u yok, sistem stabil ✅
```

---

## 🎯 Sonraki Adımlar

Watchdog 24/7 çalışıyor, şu yapabilirsin:

1. **Dashboard Raporlarını İzle**
   ```bash
   # Her 5 dakikada kontrol et
   curl http://localhost:3001/report | jq .market.spread
   ```

2. **Hataları Monitor Et**
   ```bash
   # Terminal'i açık tut ve hata log'larını izle
   ```

3. **Parametreleri Dinamik Ayarla**
   ```bash
   # Watchdog otomatik ayarlar, ama manuel de yapabilirsin
   npx hardhat run scripts/setWatchdog.js --network polygon
   ```

4. **Produksiyona Taşı (Opsiyonel)**
   ```bash
   # PM2 kullan (24/7 çalışmak için)
   npm install -g pm2
   pm2 start watchdog/autonomousWatchdog.js
   pm2 save
   ```

---

## 📊 Örnek Raporlar

### Market Data
```json
{
  "spread": "0.4521",
  "lastUpdate": 1717873200000,
  "usdcWethPrice": "1234567890123456",
  "wethUsdcPrice": "1234567890123456"
}
```

### Parameters
```json
{
  "slippageTolerance": 995,      // 0.5% tolerance
  "minProfit": 100,              // Minimum USDC
  "borrowAmount": "10000000000"  // 10,000 USDC
}
```

### Status
```json
{
  "status": "Monitoring Active",
  "uptime": 3600.5,
  "errors": {}
}
```

---

## ✅ Checklist

Başlamadan önce kontrol et:

- [ ] `.env` dosyasında `POLYGON_ARCHIVE_URL` var
- [ ] `.env` dosyasında `PRIVATE_KEY` var
- [ ] `.env` dosyasında `CONTRACT_ADDRESS` var (deploy'dan)
- [ ] `npm install` yaptım
- [ ] `node watchdog/simple-test.js` başarılı oldu
- [ ] Watchdog başlattım: `node watchdog/autonomousWatchdog.js`
- [ ] Dashboard'u kontrol ettim: `curl http://localhost:3001/report`

---

## 🔐 Güvenlik Notları

- ✅ Private key asla GitHub'a çıkmasın
- ✅ .env dosyası `.gitignore`'da olmalı
- ✅ Watchdog sadece owner hesabında çalışsın
- ✅ Her gün dashboard raporlarını kontrol et

---

## 📞 Hızlı Komutlar

```bash
# System check
node watchdog/simple-test.js

# Watchdog başlat
node watchdog/autonomousWatchdog.js

# Dashboard kontrol
curl http://localhost:3001/report

# Health check
curl http://localhost:3001/health

# PM2 ile (opsiyonel)
pm2 start watchdog/autonomousWatchdog.js
pm2 logs autonomousWatchdog
pm2 stop autonomousWatchdog
```

---

**Hazırsın! Watchdog'u çalıştır ve ilk kârlı işlemi gözlemle!** 🚀

```bash
node watchdog/autonomousWatchdog.js
```

Terminal'de şu çıktısı görünce başarılı:
```
✅ Watchdog initialized successfully
🚀 Starting autonomous monitoring...
📊 Market Data: Spread = X.XX%
📊 Dashboard running on http://localhost:3001/report
```

**İlk 30 saniye içinde ilk market data gelecek!** ⏱️
