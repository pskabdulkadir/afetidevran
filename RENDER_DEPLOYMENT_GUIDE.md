# AFETİ DEVRAN V5 - Render Deployment Guide (Gas Pricing & Profit Threshold)

## 🚨 KRİTİK SORUN VE ÇÖZÜM

### Sorun
Blokzincire gönderilen işlemler (TX) şu hataya maruz kalıyor:
- **Ağ gerektiriyor**: 150 Gwei gas price (≈ $0.40-0.80 / TX)
- **Bot gönderdiği**: $0.02 / TX (≈ 2-5 Gwei)
- **Sonuç**: Validatörler TX'i reddediyor, mempool'da bekliyor, veya "GAS_STATION_ERROR_FILTERED" olarak not düşülüyor

### Kök Neden
1. Eski sabit gas pricing kullanılıyordu (150 Gwei)
2. MIN_PROFIT_THRESHOLD çok düşüktü ($0.01)
3. EIP-1559 (dinamik base fee + priority fee) implementasyonu eksikti

### Yapılan Çözümler

#### ✅ 1. EIP-1559 Dinamik Gas Pricing
**Dosya**: `server.ts`

```typescript
// Dinamik base fee + priority fee detection
const feeData = await rpcProvider.getFeeData();
if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
  // EIP-1559 mode
  txOptions.maxFeePerGas = ethers.parseUnits(Math.min(currentGasPriceGwei * 1.15, 250).toString(), "gwei");
  txOptions.maxPriorityFeePerGas = ethers.parseUnits("50", "gwei"); // 50 Gwei miner tip
}
```

**Faydalar**:
- Ağ koşullarına göre otomatik gas price ayarlaması
- Max cap: 250 Gwei (güvenli upper bound)
- Fallback: Legacy mode (eski cümlelerle uyumluluk)

#### ✅ 2. MIN_PROFIT_THRESHOLD: $0.01 → $1.00
**Dosya**: `server.ts`, `Render Environment Variables`

```typescript
minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || "1.00")
```

**Mantık**:
- Ağ gas maliyeti: $0.40-0.80
- Minimum kâr eşiği: $1.00 (gas maliyetini 1.2x-2.5x ile karşılamak)
- Daha az kârlı işlemler otomatik olarak atlanıyor

#### ✅ 3. gasLimit: 360000 → 500000
**Dosya**: `server.ts`

```typescript
gasLimitEstimate: 500000
```

**Neden**:
- Aave V3 flash loan + arbitraj mantığı gas-yoğun
- Flash loan'dan gas ödünç alındığı için yüksek limit güvenli
- Kontrat revert olsa bile, flash loan premium otomatik kapılıyor

---

## 📋 RENDER ENVIRONMENT VARIABLES - Güncellenmiş Ayarlar

Render Dashboard'a gidin: **Settings → Environment Variables**

### Zorunlu Değişkenler (Kontrat Deploy Sonrası)

```env
CONTRACT_ADDRESS=0xC1c90074902ACD86471229c9748638942321F115
PRIVATE_KEY=your_wallet_private_key_here
POLYGON_ARCHIVE_URL=https://polygon-rpc.com
```

### Uyarlanabilir Değişkenler (Gas & Profit Tuning)

```env
# GAS PRİCİNG
MIN_PROFIT_THRESHOLD=1.00
MAX_GAS_THRESHOLD=500000

# EXECUTION MOD
SKIP_PROFIT_CHECK=false
FORCE_EXECUTION_THRESHOLD=0
```

### Opsiyonel Değişkenler

```env
RENDER_EXTERNAL_URL=https://afeti-devran-v5.onrender.com
EMERGENCY_BACKUP_WALLET=0xYourBackupAddressHere
```

---

## ⚙️ DEPLOYMENT ADIMLAR

### Step 1: Render Environment Variables'ı Güncelle

1. **Render Dashboard** açın
2. **Settings → Environment Variables**'a git
3. Şu değerleri ekle veya güncelle:

```
MIN_PROFIT_THRESHOLD = 1.00
MAX_GAS_THRESHOLD = 500000
CONTRACT_ADDRESS = 0xC1c90074902ACD86471229c9748638942321F115
```

### Step 2: Redeploy

1. **Render Dashboard**'da **Deploy** butonuna tıkla
2. Veya:
   ```bash
   git push origin main  # Otomatik redeploy tetiklenir
   ```

### Step 3: Logs'u Kontrol Et

1. **Render Logs** sekmesine git
2. Bu logları ara:
   ```
   [AFETI DEVRAN V5] 🤖 BOT KONFIGÜRASYON RAPORU
   [ENV] MIN_PROFIT_THRESHOLD: $1.00 USD
   [ENV] MAX_GAS_THRESHOLD: 500000 gwei
   [EIP-1559 Mode: Max Fee: ...] ← Dinamik gas pricing
   ```

---

## 🔧 SOLIDITY CONTRACT (Opsiyonel Optimizasyon)

Eğer kontrat kodunda manuel gas ayarlaması varsa:

### Kontrol Etme Noktası: executeMultiFlashLoan

Kontratın gas limit'i kontrol edin:

```solidity
// ❌ KÖTÜ (Sabit, düşük limit)
// tx.gasprice = 2000000000;  // 2 Gwei

// ✅ İYİ (Dinamik, ağa göre ayarlanır)
// Sözleşme kodu: tx'i direkt göndermeye izin ver, bot gas'ı kontrol etsin
```

**Bot tarafından kontrol edileceği için sözleşmede sabit gas ayarı YAPMA.**

---

## 📊 BEKLENEN SONUÇ

### Redeploy Sonrası Logs (Başarılı)

```
[AFETI DEVRAN V5] 🤖 BOT KONFIGÜRASYON RAPORU
[ENV] CONTRACT_ADDRESS: 0xC1c90074902ACD86471229c9748638942321F115
[ENV] MIN_PROFIT_THRESHOLD: $1.00 USD
[CONFIG] gasLimitEstimate: 500000
═════════════════════════════════════════════════════════════════

[DEX RADAR] Tarama başlatıldı...
[OPPORTUNITY DETECTED] USDC/WETH | Spread: %1.25 | Net Profit: $1.45 USD
[EIP-1559 Mode: Max Fee: 168.5 Gwei] 
[TRIGGER_AUTONOMOUS_TX_START] ... NetProfit: $1.45
[TX BLOKZİNCİRE GÖNDERILDI] Hash: 0x3a4b...
[BAŞARILI] arbitrajı blockchain üzerinde başarılı oldu!
```

### UI'da Görülecek Değişiklikler

- ✅ "Kayıt Sayısı: 0" → "Kayıt Sayısı: N" (success TX'leri görünür)
- ✅ "USDC SAF KAZANÇ: $0.00" → "USDC SAF KAZANÇ: $X.XX" (gerçek gelir)
- ✅ "Komut Merkezi" güncellenen gas ve profit ayarlarını gösteriyor

---

## 🐛 TROUBLESHOOTING

### Sorun: "GAS_STATION_ERROR_FILTERED" Hâlâ Görünüyor

**Sebep**: Ethers.js arka plan gas sorgusu başarısız oldu
**Çözüm**: Önemli değil, işlem hâlâ gidiyor (fallback 150 Gwei kullanılıyor)

### Sorun: TX Revert Ediyor

**Sebep**: 
- Flash loan premium hesaplama hatas
- Slippage ayarlanmamış
- Arbitraj marjı yeterli değil

**Çözüm**:
- Loglardan "FAILED_REVERT" mesajını ara
- Net profit hesaplamasının doğru olduğundan emin ol
- MIN_PROFIT_THRESHOLD'u 2.00'e yükselt

### Sorun: Hiç Fırsat Algılanmıyor

**Sebep**: 
- DEX price feed'ler çalışmıyor
- Minimum spread threshold çok yüksek

**Çözüm**:
- RPC latency'ni kontrol et
- `minSpreadThreshold` değerini 0.5% yerine 1.0% ayarla

---

## 📞 DESTEK

**Kritik Loglar**:
- `[AFETI DEVRAN V5]` - Bot başlatma raporları
- `[EIP-1559 Mode]` - Dinamik gas fiyat ayarlaması
- `[TRIGGER_AUTONOMOUS_TX]` - İşlem tetikleme
- `[TX BLOKZİNCİRE GÖNDERILDI]` - Blockchain'e gidiş
- `[BAŞARILI]` - Başarılı işlem tamamlama

---

## 📌 ÖZET

| Ayar | Eski | Yeni | Etki |
|------|------|------|------|
| Gas Pricing | Sabit 150 Gwei | EIP-1559 Dinamik | TX'lerin onaylanma hızı ↑ |
| MIN_PROFIT_THRESHOLD | $0.01 | $1.00 | Boş işlemlerden kaçınma |
| gasLimit | 360000 | 500000 | Flash loan işlemleri başarısız olmaktan kaçınma |

**Yeni sistem, ağ koşullarına kendiliğinden uyarlanıyor. ✅**
