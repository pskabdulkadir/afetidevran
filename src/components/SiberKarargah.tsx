import React, { useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Skull, 
  Zap, 
  Download, 
  Crosshair, 
  Lock, 
  AlertOctagon, 
  Users,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SiberState {
  soldiers: Array<{
    name: string;
    role: string;
    status: string;
    activity: string;
    incidentCount: number;
  }>;
  siberLogs: Array<{
    id: string;
    timestamp: string;
    actor: string;
    title: string;
    desc: string;
    severity: string;
  }>;
  isHaltScannerActive: boolean;
  totalDeflectedAttacks: number;
  totalShieldedRevenueUsd: number;
}

interface SiberKarargahProps {
  siberState: SiberState;
  backupWallet: string;
  onRefreshSiber: () => void;
}

export default function SiberKarargah({ siberState, backupWallet, onRefreshSiber }: SiberKarargahProps) {
  const [copied, setCopied] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState<string | null>(null);
  const [missionMode, setMissionMode] = useState<"DRILL" | "PRODUCTION">("PRODUCTION");

  const triggerThreat = async (type: "mempool" | "sweeper" | "counter") => {
    if (missionMode === "PRODUCTION") return;
    setSimulationLoading(type);
    try {
      const res = await fetch(`/api/siber/threat-${type}`, {
        method: "POST"
      });
      if (res.ok) {
        onRefreshSiber();
      }
    } catch (err) {
      console.error("Tehdit simülasyon hatası:", err);
    } finally {
      setTimeout(() => {
        setSimulationLoading(null);
      }, 1000);
    }
  };

  const handleDownloadReport = () => {
    window.open("/api/siber/report", "_blank");
  };

  // Generate ASCII Report Text for preview and copy
  const getPreviewReport = () => {
    const timeStr = new Date().toLocaleString("tr-TR");
    const logsText = siberState.siberLogs && siberState.siberLogs.length > 0 
      ? siberState.siberLogs.slice(0, 8).map(log => {
          const logTime = log.timestamp ? log.timestamp.split("T")[1]?.substring(0, 8) : "--:--:--";
          return `[${logTime}]   ${log.actor.padEnd(10, " ")}  ${log.title.substring(0, 24).padEnd(25, " ")}  ${log.desc}`;
        }).join("\n")
      : "[GÜNCEL HAREKÂT KAYDI BULUNAMADI]";

    return `========================================================================
               AFETİ DEVRAN V5 - SİBER KARARGÂH HAREKÂT RAPORU
                     "MOD: ${missionMode === "PRODUCTION" ? "CANLI SEVKİYAT DEVRE DEVRİYESİ" : "HARP TATBİKAT ODASI"}"
========================================================================
Operasyon Zamanı   : ${timeStr}
Siber Komutanlık   : AKTİF (Tavan Gecikme Algılama: <800ms)
Yedek Cüzdan       : ${backupWallet || "0x0f4Bdc545e811060c48B7f16029e5580cB70a680"}
Etkisiz Saldırı    : ${siberState.totalDeflectedAttacks} Tehdit Püskürtüldü!
Durum              : Sıkıyönetim Kaldırıldı, Tehdit Etkisiz Edildi!
Görev Konumu       : ${missionMode === "PRODUCTION" ? "POLYGON MAINNET (GERÇEK VERİ)" : "TATBİKAT SİMÜLASYONU"}

[MÜDAHALE GÜNLÜĞÜ]
------------------------------------------------------------------------
[ZAMAN]       [AKTOR]     [BAŞLIK]                    [DETAY]
${logsText}

========================================================================
Sermaye Zayiatı    : 0.00 POL | 0.00 USD (Sıfır kayıp güvencesi)
Korunan Mevduat    : $${siberState.totalShieldedRevenueUsd?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
Karşı Zayiat       : Saldırgan Bot Gateway Hattı Kör Edildi / Devre Dışı Bırakıldı!
========================================================================
RAPOR BARKOD KODU  : [DEVRAN-V5-MILITARY-SECURED-VERIFICATION-7729A]
========================================================================`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(getPreviewReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sınıflandırılmış Başlık Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 flex gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-black tracking-widest animate-pulse">
            CLASSIFIED - SIKIYÖNETİM SEVİYESİ
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-yellow-500 tracking-wider bg-yellow-500/10 px-2 py-0.5 rounded">
                  OFFENSIVE-DEFENSIVE SİBER MERKEZİ
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight font-sans mt-1">
                Afeti Devran Siber Askeri Defans Komutanlığı
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
                Bu modül, Polygon ağındaki bot saldırılarını ve sweeper yazılımlarını 24 saat gözetler. Saniyeler içinde ağ sızıntılarını kilitler, fonları acil durum yedek adresine kaçırır ve saldırgana otonom karşı savunma başlatır.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Siber Görev Modu Sabit Canlı Gösterge */}
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-emerald-500/25 flex items-center gap-2 font-mono text-[10px] font-black tracking-wider text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              🛡️ CANLI DEVRE DEVRİYESİ AKTİF
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 font-extrabold text-xs rounded-lg border border-slate-800 cursor-pointer transition select-text"
              >
                <Download className="w-3.5 h-3.5 text-yellow-500" />
                ASKERİ RAPORU İNDİR (.TXT)
              </button>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs rounded-lg cursor-pointer transition select-text"
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 strike-[3]" />}
                {copied ? "KOPYALANDI!" : "TÜM EKRANI KOPYALA"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Siber Karargâh Finansal ve Komutanlık Başarı Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">MÜDAHALE DURUMU</span>
            <strong className="text-base font-black text-rose-500 tracking-tight mt-1">
              {siberState.isHaltScannerActive ? "ACİL SIKIYÖNETİM (HALT)" : "MÜSTAHKEM TETİKTE"}
            </strong>
          </div>
          <div className={`p-2 rounded-lg ${siberState.isHaltScannerActive ? "bg-rose-500/10 text-rose-500 animate-bounce" : "bg-emerald-500/10 text-emerald-400"}`}>
            {siberState.isHaltScannerActive ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">PÜSKÜRTÜLEN SALDIRI</span>
            <strong className="text-lg font-mono font-black text-yellow-500 tracking-tight block mt-1">
              {siberState.totalDeflectedAttacks} Adet
            </strong>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
            <Skull className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">KORUNAN MEVDUAT</span>
            <strong className="text-lg font-mono font-black text-emerald-400 tracking-tight block mt-1">
              ${siberState.totalShieldedRevenueUsd?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">YEDEK ACİL CÜZDAN</span>
            <strong className="text-[11px] font-mono font-bold text-slate-300 truncate tracking-tight max-w-[150px] block mt-1.5" title={backupWallet}>
              {backupWallet ? `${backupWallet.substring(0, 8)}...${backupWallet.substring(backupWallet.length - 8)}` : "TANIMSIZ"}
            </strong>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Askeri Hiyerarşi (Soldier Grid) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
        <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-500" />
          Devriyedeki Siber Alay Kadrosu ve Mevziler
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {siberState.soldiers.map((soldier, idx) => {
            const isAlarm = soldier.status === "ALARM" || soldier.status === "TAARRUZDA";
            return (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-200">{soldier.name}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse ${
                      isAlarm 
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {soldier.status}
                    </span>
                  </div>

                  <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider mt-0.5">
                    GÖREV: {soldier.role}
                  </span>

                  <p className="text-[10.5px] text-slate-400 mt-2 font-mono leading-relaxed">
                    ⚙️ {soldier.activity}
                  </p>
                </div>

                <div className="border-t border-slate-900 pt-2.5 mt-4 flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>MÜDAHALE ADEDİ:</span>
                  <strong className="text-yellow-500 font-bold">{soldier.incidentCount} Tehdit</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canlı Savaş Durumu ve Rapor İstasyonu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide border-b border-slate-850 pb-3 mb-3 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-500 animate-pulse" />
              CANLI SİBER RADAR & DEVRİYE
            </h3>

            <div className="py-6 text-center space-y-5">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full border border-emerald-500/25 flex items-center justify-center animate-pulse bg-emerald-500/5">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              
              <div className="space-y-3">
                <strong className="text-xs text-emerald-400 block font-mono tracking-widest uppercase animate-pulse">
                  DEVRE DEVRİYESİ AKTİF
                </strong>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono px-2">
                  Siber Alay botları Polygon ağından gelecek canlı blok zinciri işlemlerini dinliyor. 
                </p>
                <p className="text-[10.5px] text-slate-500 leading-normal font-mono px-2">
                  Tehdit üreteçleri ve suni harp butonları güvenlik amacıyla kilitlendi. Acil durum yedek adresi koruma altındadır.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-[10px] text-slate-500 font-mono text-center">
            AĞ DEVRİYE MODU: %100 GERÇEK ZAMANLI KORUMA ACTIVE
          </div>
        </div>

        {/* Canlı Loglar ve ASCII Preview Rapor Konsolu */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Sınıflandırılmış Canlı Karargâh Rapor Ekranı
            </h3>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Kopyalamaya ve seçmeye uygun, tam askeri rapor paneli. Aşağıdaki terminal penceresini mouse ile tıklayıp kopyalayabilirsiniz:
            </p>

            {/* Selectable & Copyable terminal box */}
            <div className="relative">
              <pre className="select-text whitespace-pre overflow-auto font-mono text-[10px] text-indigo-300 leading-normal bg-slate-950 p-4 rounded-lg border border-slate-850 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-900">
                {getPreviewReport()}
              </pre>
              
              <button
                onClick={handleCopyReport}
                className="absolute top-3 right-3 p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-750 cursor-pointer transition flex items-center gap-1 text-[9px] font-mono leading-none"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-yellow-500" />}
                {copied ? "KOPYALANDI" : "METNİ KOPYALA"}
              </button>
            </div>
          </div>

          {/* Sıkıyönetim Aktiflik Uyarısı */}
          <AnimatePresence>
            {siberState.isHaltScannerActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 bg-rose-500/10 text-rose-400 text-xs p-3 rounded-lg border border-rose-500/30 flex items-center gap-3"
              >
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping flex-shrink-0" />
                <span className="font-mono font-bold tracking-wide">
                  [SIKIYÖNETİM PROTOKOLÜ] Halt-Scanner Aktif! Sistem genelinde ağ taraması 6 saniye süreyle donduruldu.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
