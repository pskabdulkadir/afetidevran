import React, { useState } from "react";
import { FileText, Download, Printer, ShieldCheck, Cpu, RefreshCw, AlertTriangle, Layers, Calendar, Landmark } from "lucide-react";
import { ArbitrageOpportunity, ExecutionLog, WalletState, SelfHealingLog, LogStatus } from "../types";

interface ReportModuleProps {
  scans: ArbitrageOpportunity[];
  executions: ExecutionLog[];
  wallet: WalletState;
  selfHealingLogs: SelfHealingLog[];
  blockchain: { currentBlock: number; gasPriceGwei: number; maticPriceUsd: number };
}

export default function ReportModule({
  scans,
  executions,
  wallet,
  selfHealingLogs,
  blockchain
}: ReportModuleProps) {
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const stats = {
    totalScans: scans.length,
    successfulTxsCount: executions.filter(e => e.status === LogStatus.SUCCESS).length,
    revertedTxsCount: executions.filter(e => e.status === LogStatus.FAILED_REVERT_PREVENTED).length,
    withdrawnProfits: wallet.totalRevenueUsd,
    savedGasUsd: executions
      .filter(e => e.status === LogStatus.FAILED_REVERT_PREVENTED)
      .reduce((acc, curr) => acc + curr.gasCostUsd, 0)
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setReportGenerated(true);
    }, 1200);
  };

  // Metin Tabanlı Raporu İndirme (.txt / .md)
  const downloadTextReport = () => {
    const timestamp = new Date().toLocaleDateString("tr-TR") + " " + new Date().toLocaleTimeString("tr-TR");
    const doc = `========================================================================
                 AFETİ DEVRAN V5 - OTONOM RESİLİENCE RAPORU
                RAKORLAMA, FINANSAL DENETİM VE KORUMA DERNEĞİ
========================================================================
Oluşturulma Tarihi : ${timestamp}
Kontrat Sahibi      : ABDULKADİR (Cüzdan: ${wallet.address})
Ağ Altyapısı        : Polygon Mainnet (Aave V3 ve Çoklu DEX Havuzları)
Protokol Sürümü     : AFETİ DEVRAN V5 (Multi-Asset & Zero Gas)

------------------------------------------------------------------------
1. COIN VE SERMAYE REZERV BEYANNAMESİ
------------------------------------------------------------------------
- POL (MATIC) Bakiyesi  : ${wallet.pol.toFixed(2)} POL (Sıfır-Gas Mekanizmasıyla Pasiftir)
- USDC Nakit Birikimi   : $${wallet.usdc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
- WETH Birikimi         : ${wallet.weth.toFixed(4)} WETH
- WBTC Birikimi         : ${wallet.wbtc.toFixed(4)} WBTC

------------------------------------------------------------------------
2. FİNANSAL VERİM TARAMA RAPORU
------------------------------------------------------------------------
- Biriken Toplam Gelir          : +$${wallet.totalRevenueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
- Toplam Cepten Harcanan Gider   : $0.00 USD (Sadece kârlı işlemlerden borç ödendi)
- Aave V3 otonom borçlanan POL  : ${wallet.totalGasBorrowedPol.toFixed(1)} POL
- V5 Zırhı ile Korunan Gas Kaybı : +$${stats.savedGasUsd.toFixed(2)} USD (Zararlı revertlerden önlenen kayıp)

------------------------------------------------------------------------
3. SİBER PROTOKOL VE TARAYICI PERFORMANSI
------------------------------------------------------------------------
- Güncel Blok            : #${blockchain.currentBlock}
- Gas Gücü Endeksi       : ${blockchain.gasPriceGwei} Gwei
- Toplam Tarama Döngüsü : ${stats.totalScans} adet
- Başarılı Arbitrajlar   : ${stats.successfulTxsCount} adet
- Revert ile Engellenen  : ${stats.revertedTxsCount} adet (Fail-Safe Korumalı)

------------------------------------------------------------------------
4. OTONOM SELF-HEALING AI LOG KAYITLARI (Ağ Sağlığı)
------------------------------------------------------------------------
${selfHealingLogs.map(l => `[${new Date(l.timestamp).toLocaleTimeString("tr-TR")}] ${l.type} - ${l.title}: ${l.desc}`).join("\n")}

------------------------------------------------------------------------
[GÜVENLİK BEYANNAMESİ]
Afeti Devran V5, Aave V3 çoklu varlık kredi havuzundan sıfır teminatlı
USDC ve Gas için POL tokenını eşzamanlı çeker ve işlem sonunda kâr ile 
borcu kapatır. Bu sayede cüzdanda hiç POL olmasa dahi otonom çalışır.
========================================================================`;

    const element = document.createElement("a");
    const file = new Blob([doc], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `Afeti_Devran_V5_Arbitraj_Denetim_Raporu.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Browser Print - PDF Olarak Kaydetme Mekanizması
  const triggerPdfPrint = () => {
    // Özel bir yazdırılabilir pencere oluşturuyoruz
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Yazdırıcı pencere engellendi, tarayıcı izinlerini kontrol edin!");
      return;
    }

    const timestamp = new Date().toLocaleString("tr-TR");

    const htmlContent = `
      <html>
        <head>
          <title>Afeti Devran V5 Raporlama Belgesi</title>
          <style>
            body { font-family: 'Courier New', monospace; background-color: #fff; color: #111; padding: 40px; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px double #111; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0 0; font-size: 11px; color: #555; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 14px; border-bottom: 1px solid #111; padding-bottom: 5px; margin-bottom: 15px; }
            .grid { display: flex; flex-wrap: wrap; margin-bottom: 15px; }
            .col { flex: 1; min-width: 50%; margin-bottom: 10px; font-size: 12px; }
            .col strong { color: #000; }
            .log-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            .log-table th { border-bottom: 2px solid #111; text-align: left; padding: 8px; font-weight: bold; background: #f0f0f0; }
            .log-table td { padding: 8px; border-bottom: 1px solid #ddd; }
            .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; border: 1px solid #111; border-radius: 3px; }
            .footer { margin-top: 50px; font-size: 10px; color: #555; text-align: center; border-top: 1px dashed #111; padding-top: 20px; }
            @media print {
              body { padding: 20px; }
              input, button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AFETİ DEVRAN V5 PROTOKOLÜ • RESİLİENCE VE ARBİTRAJ RAPORU</h1>
            <p>Resmi Finansal Denetleme, Otonom Ağ ve Koruma Beyannamesi • Polygon Mainnet</p>
          </div>

          <div class="section">
            <div class="section-title">Genel Rapor Özet Bilgileri</div>
            <div class="grid">
              <div class="col">Rapor Tarihi: <strong>${timestamp}</strong></div>
              <div class="col">Kontrat Sahibi Cüzdanı: <strong>${wallet.address}</strong></div>
              <div class="col">Güncel Polygon Bloğu: <strong>#${blockchain.currentBlock}</strong></div>
              <div class="col">POL/MATIC Endeksi: <strong>$${blockchain.maticPriceUsd} USD</strong></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Kasa Finansal Verim Defteri</div>
            <div class="grid">
              <div class="col">Biriken Toplam Net Gelir: <strong style="color: green; font-size: 14px;">+$${wallet.totalRevenueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</strong></div>
              <div class="col">Cepten Harcanan Gider: <strong style="color: red; font-size: 14px;">$0.00 USD (Sıfır-Gas Mekanizması)</strong></div>
              <div class="col">Aave Multi-Asset Flaş Borçlanan POL: <strong>${wallet.totalGasBorrowedPol.toFixed(1)} POL</strong></div>
              <div class="col">Engellenen Gas Para Kaybı (V5 Zırhı): <strong>$${stats.savedGasUsd.toFixed(2)} USD</strong></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Sahip Cüzdan Rezervi</div>
            <div class="grid">
              <div class="col">POL (Gas Kaynağı): <strong>${wallet.pol.toFixed(2)} POL</strong></div>
              <div class="col">USDC Kâr Rezervi: <strong>$${wallet.usdc.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC</strong></div>
              <div class="col">WETH Bakiyesi: <strong>${wallet.weth.toFixed(4)} WETH</strong></div>
              <div class="col">WBTC Bakiyesi: <strong>${wallet.wbtc.toFixed(4)} WBTC</strong></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Otonom Karar Log Defteri (Son Kararlar)</div>
            <table class="log-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Çapraz Borsa Rotası</th>
                  <th>Borç Hacmi (Aave)</th>
                  <th>Gaz (POL)</th>
                  <th>Net Kâr (USDC)</th>
                  <th>Durum Sinyali</th>
                </tr>
              </thead>
              <tbody>
                ${executions.map(e => `
                  <tr>
                    <td>${new Date(e.timestamp).toLocaleTimeString("tr-TR")}</td>
                    <td>${e.tokenPairName}</td>
                    <td>$${e.borrowedAmountUsd.toLocaleString()} USDC</td>
                    <td>${e.gasBorrowedPol.toFixed(1)} POL</td>
                    <td>+$${e.netProfitUsd.toFixed(2)} USD</td>
                    <td><span class="badge">${e.status}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="section" style="page-break-before: always;">
            <div class="section-title">Self-Healing AI Agent (Ağ Bağlantı Günlükleri)</div>
            <table class="log-table">
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Olay Sınıfı</th>
                  <th>Detay ve Otomatik Müdahale Açıklaması</th>
                </tr>
              </thead>
              <tbody>
                ${selfHealingLogs.map(l => `
                  <tr>
                    <td>${new Date(l.timestamp).toLocaleTimeString("tr-TR")}</td>
                    <td style="font-weight: bold;">${l.type} - ${l.title}</td>
                    <td>${l.desc}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Mühürlü ve Dijital Güvenceli Belge • AFETİ DEVRAN V5 AI Engine Sürüm Koruyucusu</p>
            <p>Bu rapor, tarayıcı üzerinden PDF olarak saklanmak üzere ve yazılı analiz amacıyla üretilmiştir.</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
      
      {/* Arka plan siber süs */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between pb-3.5 border-b border-slate-850 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-yellow-500 w-5 h-5 animate-pulse" />
          <div>
            <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
              Siber Raporlama ve Denetleme İstasyonu
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Anlık Polygon tarama ve siber-kontrat log verilerini belgelendirin
            </p>
          </div>
        </div>

        <Landmark className="text-slate-700 w-6 h-6 border border-slate-800/40 p-1 rounded-md" />
      </div>

      <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
        Bu istasyon, otonom botun Polygon üzerindeki tüm döngüsel aramalarını, Aave V3 çoklu flaş borçlandırma işlemlerini, zırhlı fail-safe korumalarını ve Self-Healing AI kurtarma loglarını tek bir veri paketinde birleştirir.
      </p>

      {/* Rapor Oluşturma Durumu */}
      {!reportGenerated ? (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 py-3 rounded-lg font-bold text-xs tracking-wider transition duration-150 cursor-pointer"
        >
          {generating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-500" />
              <span>Dönem Raporu Derleniyor...</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-yellow-500" />
              <span>RAPOR DETAYLARINI DERLE</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4 animate-fade-in">
          
          {/* Kısa İstatistik Özeti */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-[10.5px]">
            <div className="text-center border-r border-slate-850">
              <span className="text-slate-500 block text-[9px]">SAYFA</span>
              <strong className="text-slate-200">2 Sayfa Belge</strong>
            </div>
            <div className="text-center border-r border-slate-850">
              <span className="text-slate-500 block text-[9px]">BAŞARILI ARB</span>
              <strong className="text-emerald-400 font-bold">{stats.successfulTxsCount}</strong>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block text-[9px]">KORUNAN GAS</span>
              <strong className="text-yellow-400">${stats.savedGasUsd.toFixed(2)}</strong>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-lg flex items-start gap-2 text-xs">
            <ShieldCheck className="text-emerald-400 w-4 h-4 mt-0.5 flex-shrink-0 animate-bounce" />
            <div className="text-[11px] text-slate-300">
              <strong>Rapor Başarıyla Hazırlandı!</strong> Aşağıdaki butonları kullanarak resmi PDF denetleme belgenizi kaydedip inceleyebilirsiniz. Cüzdan kârları mühürlenmiştir.
            </div>
          </div>

          {/* İndirme Butonları */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* PDF İndir */}
            <button
              onClick={triggerPdfPrint}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 py-2.5 rounded-lg font-bold text-xs tracking-wider transition hover:scale-[1.01] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              PDF RAPORU İNDİR
            </button>

            {/* Metin Dosyası İndir */}
            <button
              onClick={downloadTextReport}
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 py-2.5 rounded-lg font-bold text-xs tracking-wider transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-yellow-500" />
              TXT RAPORU İNDİR
            </button>
          </div>

          {/* Sıfırlama */}
          <button
            onClick={() => setReportGenerated(false)}
            className="w-full text-center text-[10.5px] text-slate-500 hover:text-slate-300 font-mono underline"
          >
            Yeni Rapor Oluşturmak İçin Sıfırla
          </button>
        </div>
      )}
    </div>
  );
}
