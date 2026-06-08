import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Settings, 
  Play, 
  Square, 
  HelpCircle, 
  RotateCcw, 
  Sliders, 
  Compass, 
  Code2, 
  Layers, 
  ArrowUpRight,
  RefreshCw,
  Info,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  HeartPulse,
  Database
} from "lucide-react";

import { BotConfig, ArbitrageOpportunity, ExecutionLog, WalletState, SelfHealingLog } from "./types";
import NetworkStats from "./components/NetworkStats";
import ScansTable from "./components/ScansTable";
import ExecutionConsole from "./components/ExecutionConsole";
import ContractConsole from "./components/ContractConsole";
import WalletPanel from "./components/WalletPanel";
import ReportModule from "./components/ReportModule";
import SiberKarargah from "./components/SiberKarargah";
import CommandCenter from "./components/CommandCenter";

export default function App() {
  const [config, setConfig] = useState<BotConfig>({
    polygonRpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/private-mev-rpc",
    minSpreadThreshold: 0.8,
    borrowAmountUsd: 250000,
    gasToBorrowPol: 5,
    isRunning: true,
    automaticExecution: false,
    gasLimitEstimate: 360000,
    mevPrivateRelay: true,
    latencyThresholdMs: 800,
    omniChainEnabled: false,
    dynamicBatchingEnabled: false,
    mempoolScanningEnabled: false,
    contractAddress: "0x0000000000000000000000000000000000000000",
    forceExecutionThreshold: 0
  });

  const [blockchain, setBlockchain] = useState({
    currentBlock: 59312019,
    gasPriceGwei: 74,
    maticPriceUsd: 0.62,
    lastScannedAt: ""
  });

  const [scans, setScans] = useState<ArbitrageOpportunity[]>([]);
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [tokenPairs, setTokenPairs] = useState<any[]>([]);
  const [rpcStatusList, setRpcStatusList] = useState<any[]>([]);
  const [wallet, setWallet] = useState<WalletState>({
    address: "Yükleniyor...",
    pol: 0.00,
    usdc: 0.00,
    weth: 0.00,
    wbtc: 0.00,
    totalRevenueUsd: 0.00,
    totalExpensesUsd: 0.00,
    totalGasBorrowedPol: 0.00,
    loading: true
  });
  const [selfHealingLogs, setSelfHealingLogs] = useState<SelfHealingLog[]>([]);
  const [siberState, setSiberState] = useState<{
    soldiers: any[];
    siberLogs: any[];
    isHaltScannerActive: boolean;
    totalDeflectedAttacks: number;
    totalShieldedRevenueUsd: number;
  }>({
    soldiers: [],
    siberLogs: [],
    isHaltScannerActive: false,
    totalDeflectedAttacks: 0,
    totalShieldedRevenueUsd: 0.00
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<"monitor" | "contracts" | "siber_karargah">("monitor");

  const [customThreshold, setCustomThreshold] = useState<number>(0.8);
  const [customBorrow, setCustomBorrow] = useState<number>(250000);
  const [customGasBorrow, setCustomGasBorrow] = useState<number>(5);
  const [customAutoExec, setCustomAutoExec] = useState<boolean>(false);
  const [customLatencyThreshold, setCustomLatencyThreshold] = useState<number>(800);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error("API Bağlantısı Koptu");
      const data = await res.json();
      
      setConfig(data.config);
      setBlockchain(data.blockchain);
      setScans(data.scans);
      setExecutions(data.executions);
      setTokenPairs(data.tokenPairs);
      if (data.wallet) setWallet(data.wallet);
      if (data.selfHealingLogs) setSelfHealingLogs(data.selfHealingLogs);
      if (data.rpcStatusList) setRpcStatusList(data.rpcStatusList);
      if (data.siberState) setSiberState(data.siberState);
    } catch (err) {
      console.warn("Backend API çekilemedi, yerel stateler kullanılıyor.", err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCustomThreshold(config.minSpreadThreshold);
    setCustomBorrow(config.borrowAmountUsd);
    setCustomGasBorrow(config.gasToBorrowPol || 5);
    setCustomAutoExec(config.automaticExecution);
    setCustomLatencyThreshold(config.latencyThresholdMs || 800);
  }, [config.minSpreadThreshold, config.borrowAmountUsd, config.gasToBorrowPol, config.automaticExecution, config.latencyThresholdMs]);

  const handleConfigUpdate = async (updatedFields: Partial<BotConfig>) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (e) {
      console.error("Parametreler güncellenemedi", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBot = async (isRunning: boolean) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/start-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run: isRunning })
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({ ...prev, isRunning: data.isRunning }));
      }
    } catch (e) {
      console.error("Daemon durumu güncellenemedi", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetSystem = async () => {
    if (!window.confirm("Siber Karargâh ve Arbitraj Motorunu sıfırlayarak %100 canlı Polygon Mainnet devriye moduna almak istediğinize emin misiniz? Bütün simülasyon ve tatbikat kayıtları temizlenecektir.")) {
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch("/api/reset", {
        method: "POST"
      });
      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error("Sıfırlama başarısız oldu", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-yellow-500/30">
      
      {/* Üst Logo ve Durum Menüsü */}
      <header className="border-b border-slate-900 bg-slate-950 py-4 px-6 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-yellow-500/10">
              <TrendingUp className="w-5.5 h-5.5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider text-slate-50">
                  AFETİ DEVRAN
                </span>
                <span className="text-[9px] font-bold text-slate-950 bg-yellow-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  V5 NO-CAPITAL LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-tight">
                Aave V3 Çoklu Varlık Flaş Borçlandırma & Otonom Hata Düzelticili Arbitraj Motoru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode("monitor")}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md tracking-tight transition ${
                  viewMode === "monitor"
                    ? "bg-slate-800 text-slate-100 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-yellow-500" />
                Ana Panel ve Kasa
              </button>
              <button
                onClick={() => setViewMode("contracts")}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md tracking-tight transition ${
                  viewMode === "contracts"
                    ? "bg-slate-800 text-slate-100 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Solidity Kodları
              </button>
              <button
                onClick={() => setViewMode("siber_karargah")}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md tracking-tight transition ${
                  viewMode === "siber_karargah"
                    ? "bg-slate-800 text-slate-100 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                Siber Karargâh
              </button>
            </div>

             {/* Daemon Toggle */}
            <button
              onClick={() => handleToggleBot(!config.isRunning)}
              disabled={isUpdating}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold rounded-lg tracking-wide shadow-lg cursor-pointer transition transform active:scale-95 ${
                config.isRunning
                  ? "bg-rose-500 text-white hover:bg-rose-400"
                  : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              }`}
            >
              {config.isRunning ? (
                <>
                  <Square className="w-3 h-3 fill-current animate-pulse" />
                  TARAMAYI DURDUR
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  TARAMAYI BAŞLAT
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Network parameters */}
        <NetworkStats
          currentBlockNumber={blockchain.currentBlock}
          gasPriceGwei={blockchain.gasPriceGwei}
          maticPriceUsd={blockchain.maticPriceUsd}
          lastScannedAt={blockchain.lastScannedAt}
        />

        {/* Dynamic V5 Gelişmiş Güvenlik/Gas Koruma Bannerı */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-tight">
                AFETİ DEVRAN V5: SIFIR SERMAYE GÜVENCESİ & GÜNCEL RPC SIZINTISI
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-3xl">
                Bu sürümde, her kârlı takas işlemi keşfedildiğinde Aave V3 üzerinden hem USDC hem de POL aynı anda borç alınır. Gas harcamaları <strong>borçlanılan POL</strong> ile kontrat içinden karşılanır. Kârsız durumlarda koruyucu zırh işlemi geri çeker. Cüzdan bakiye kaybı: <strong>0 POL</strong>!
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono text-[9.5px]">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 border border-slate-850 rounded text-slate-300">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span>7/24 Keep-Alive Pinger Akışta</span>
            </div>
            <span className="text-slate-500 font-semibold truncate max-w-[170px]" title="Aktif Sunucu RPC Alanı">
              RPC: {config.polygonRpcUrl}
            </span>
          </div>
        </div>

        {viewMode === "monitor" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Sol Sütun: Kontroller, Kasa Cüzdanı, Raporlama ve Simülatör */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Parametre Düzenleme Kartı */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                  <Sliders className="text-yellow-500 w-4 h-4" />
                  <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
                    Genel Arbitraj Parametreleri
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Slider: Profit Trigger */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Asgari Arbitraj Kâr Marjı</span>
                      <strong className="text-yellow-500 font-mono text-[11px] font-bold">%{customThreshold} Spread</strong>
                    </div>
                    <input
                      type="range"
                      min="0.00"
                      max="3.00"
                      step="0.01"
                      value={customThreshold}
                      onChange={(e) => setCustomThreshold(parseFloat(e.target.value))}
                      onMouseUp={() => handleConfigUpdate({ minSpreadThreshold: customThreshold })}
                      onTouchEnd={() => handleConfigUpdate({ minSpreadThreshold: customThreshold })}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1 leading-relaxed">
                      Likit havuzları zincirleri arasında yakalanması gereken minimum fiyat farkı (%).
                    </span>
                  </div>

                  {/* Hacim Seçimi */}
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wide">
                      Flaş Kredi Hacmi (USDC)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customBorrow}
                        step="50000"
                        onChange={(e) => setCustomBorrow(parseInt(e.target.value) || 0)}
                        onBlur={() => handleConfigUpdate({ borrowAmountUsd: customBorrow })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono outline-none text-slate-200 focus:border-slate-700"
                      />
                      <span className="absolute right-3 top-3 text-[10px] text-slate-500 font-mono">
                        USDC
                      </span>
                    </div>
                  </div>

                  {/* Gaz İçin Borç Alınacak POL */}
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wide">
                      Gas İçin Eşzamanlı Borç POL
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customGasBorrow}
                        step="1"
                        min="1"
                        onChange={(e) => setCustomGasBorrow(parseInt(e.target.value) || 5)}
                        onBlur={() => handleConfigUpdate({ gasToBorrowPol: customGasBorrow })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono outline-none text-slate-200 focus:border-slate-700"
                      />
                      <span className="absolute right-3 top-3 text-[10px] text-slate-500 font-mono">
                        POL (Gas)
                      </span>
                    </div>
                  </div>

                  {/* Otonom Keşif */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start gap-2.5">
                    <input
                      id="auto-exec"
                      type="checkbox"
                      checked={customAutoExec}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setCustomAutoExec(val);
                        handleConfigUpdate({ automaticExecution: val });
                      }}
                      className="mt-1 w-3.5 h-3.5 rounded bg-slate-950 border-slate-850 text-yellow-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="auto-exec" className="block text-xs font-bold text-slate-300 cursor-pointer select-none uppercase tracking-wide">
                        Otonom Akıllı Keşif
                      </label>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        Karlı sinyal yakalandığında bot cüzdan adına milisaniyede işlemi kontrata gönderir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RPC Latency Aggregator & Load Balancer Kontrol Kartı */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2">
                    <Cpu className="text-yellow-500 w-4 h-4 animate-spin-slow" />
                    <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
                      RPC Load Balancer Katmanı
                    </h3>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                    ONLINE
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed">
                  Tüm RPC sunucularını eş zamanlı sorgular ve gecikmesi <strong className="text-emerald-400">&lt;200ms</strong> olan en hızlı düğümü "Birincil (Primary)" tayin eder.
                </p>

                {/* Tavan Limit Ayarı */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">RPC Gecikme Tavan Limiti (Timeout)</span>
                    <strong className="text-yellow-500 font-mono text-[11px] font-bold">{customLatencyThreshold} ms</strong>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="1500"
                    step="50"
                    value={customLatencyThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomLatencyThreshold(val);
                    }}
                    onMouseUp={() => handleConfigUpdate({ latencyThresholdMs: customLatencyThreshold })}
                    onTouchEnd={() => handleConfigUpdate({ latencyThresholdMs: customLatencyThreshold })}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 leading-relaxed">
                    Düğüm bu sürede yanıt vermezse siber motor onu derhal pasifize edip diğer yedek RPC'ye mikrosaniyede atlar.
                  </span>
                </div>

                {/* Canlı RPC Gecikme Grid Matrix */}
                <div className="space-y-2 border-t border-slate-850 pt-3">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-2">
                    Aktif Bağlantı Havuzu Durumu
                  </span>

                  {rpcStatusList.map((rpc, idx) => {
                    const isPrimary = rpc.status === "PRIMARY";
                    const isTimeout = rpc.status === "TIMEOUT";
                    const isLatent = rpc.status === "LATENT";

                    return (
                      <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isPrimary ? "bg-emerald-400 animate-ping" : (isTimeout ? "bg-rose-500" : (isLatent ? "bg-amber-400" : "bg-blue-400"))
                            }`}></span>
                            <span className="text-[10px] font-bold text-slate-300 truncate max-w-[150px]">{rpc.name}</span>
                          </div>

                          <div className="flex items-center gap-2 font-mono">
                            <span className={`font-bold text-[10px] ${
                              isTimeout ? "text-rose-400" : (isPrimary ? "text-emerald-400" : "text-sky-400")
                            }`}>{rpc.latencyMs}ms</span>

                            <span className={`text-[8px] font-extrabold px-1 rounded uppercase ${
                              isPrimary 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : (isTimeout 
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" 
                                    : "bg-slate-800 text-slate-400")
                            }`}>
                              {rpc.status}
                            </span>
                          </div>
                        </div>

                        {/* Visual progress bar bar */}
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition duration-500 ${
                              isTimeout ? "bg-rose-500" : (isPrimary ? "bg-emerald-500" : (isLatent ? "bg-amber-500" : "bg-sky-500"))
                            }`}
                            style={{ width: `${Math.min(100, (rpc.latencyMs / customLatencyThreshold) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uluslararası Siber Strateji HUB'ı */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                  <Layers className="text-yellow-500 w-4 h-4" />
                  <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
                    Uluslararası Siber Geliştirme Katmanı
                  </h3>
                </div>

                <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed">
                  Afeti Devran V5 platformunu bir sonraki seviyeye taşımak için stratejik modülleri buradan otonom yönetebilirsiniz:
                </p>

                <div className="space-y-3">
                  {/* 1. Omni-Chain */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-extrabold text-slate-200 block uppercase tracking-wide">
                        1. Omni-Chain Genişleme (LayerZero)
                      </label>
                      <p className="text-[9.5px] text-slate-400 leading-relaxed">
                        Polygon-Base'in yanı sıra; Arbitrum, Optimism ve BSC arasındaki çapraz zincir (inter-chain) fırsatlarını tarar ve LayerZero/Axelar köprü tünelleriyle arbitrajı tam doğrular.
                      </p>
                    </div>
                    <button
                      onClick={() => handleConfigUpdate({ omniChainEnabled: !config.omniChainEnabled })}
                      className={`text-[9px] font-black px-2 py-1 rounded transition duration-150 flex-shrink-0 cursor-pointer ${
                        config.omniChainEnabled
                          ? "bg-yellow-500 text-slate-950"
                          : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {config.omniChainEnabled ? "AKTİF" : "PASİF"}
                    </button>
                  </div>

                  {/* 2. Smart-Batching */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-extrabold text-slate-200 block uppercase tracking-wide">
                        2. Smart-Batching Likidasyon Optimizasyonu
                      </label>
                      <p className="text-[9.5px] text-slate-400 leading-relaxed">
                        Toplu işlemleri tek bir sert atomik blok yerine, o anki ağ Gwei değerine göre dinamik mikro porsiyonlara (Chunks) ayırır. <strong className="text-yellow-500">BATCH_SETTLE_FAILED</strong> hatalarını sıfırlar.
                      </p>
                    </div>
                    <button
                      onClick={() => handleConfigUpdate({ dynamicBatchingEnabled: !config.dynamicBatchingEnabled })}
                      className={`text-[9px] font-black px-2 py-1 rounded transition duration-150 flex-shrink-0 cursor-pointer ${
                        config.dynamicBatchingEnabled
                          ? "bg-yellow-500 text-slate-950"
                          : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {config.dynamicBatchingEnabled ? "AKTİF" : "PASİF"}
                    </button>
                  </div>

                  {/* 3. Predictive Mempool */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-extrabold text-slate-200 block uppercase tracking-wide">
                        3. Önleyici Mempool Tarayıcı (Frontrun)
                      </label>
                      <p className="text-[9.5px] text-slate-400 leading-relaxed">
                        Milli-saniyelerce önce henüz bloklanmamış bekleyen (pending) swap işlemlerini mempool seviyesinde deşifre eder ve kârı rakipler kapmadan tetikler.
                      </p>
                    </div>
                    <button
                      onClick={() => handleConfigUpdate({ mempoolScanningEnabled: !config.mempoolScanningEnabled })}
                      className={`text-[9px] font-black px-2 py-1 rounded transition duration-150 flex-shrink-0 cursor-pointer ${
                        config.mempoolScanningEnabled
                          ? "bg-yellow-500 text-slate-950"
                          : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {config.mempoolScanningEnabled ? "AKTİF" : "PASİF"}
                    </button>
                  </div>
                </div>
              </div>

              {/* V5 Kasa Cüzdan Hesabı Takip Paneli */}
              <WalletPanel wallet={wallet} />

              {/* Rapor Denetleme ve PDF İndirme İstasyonu */}
              <ReportModule 
                scans={scans}
                executions={executions}
                wallet={wallet}
                selfHealingLogs={selfHealingLogs}
                blockchain={blockchain}
              />
            </div>

            {/* Sağ Sütun: Taramalar, Karar Günlüğü, Resilience Terminal */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Tarama Tablosu */}
              <ScansTable scans={scans} minSpread={config.minSpreadThreshold} />

              {/* Otonom Hata Düzeltici Terminal İzleyicisi */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-850 mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/25">
                      <Cpu className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
                        Otonom Resilience Modülü (Self-Healing Guardian AI)
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        Sistem RPC çökmelerini, ağ gecikmelerini ve JS istisnalarını otonom çözer
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                    <HeartPulse className="w-3.5 h-3.5" />
                    BÖBREK TESTİ: SORUNSUZ
                  </div>
                </div>

                {/* Resilience Logs Terminal */}
                <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-900 font-mono text-[10.5px] max-h-48 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {selfHealingLogs.length === 0 ? (
                    <div className="text-slate-500 italic text-center py-4">
                      Otonom bağlantı izleme logu bekleniyor. Sistem stabil çalışıyor...
                    </div>
                  ) : (
                    selfHealingLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 items-start leading-relaxed pb-2 border-b border-slate-900/40 last:border-0 last:pb-0">
                        <span className="text-slate-500 font-semibold whitespace-nowrap flex-shrink-0">
                          [{new Date(log.timestamp).toLocaleTimeString("tr-TR")}]
                        </span>
                        <div>
                          <strong className={`font-bold ${
                            log.type === "WARNING" 
                              ? "text-rose-400" 
                              : log.type === "RESOLVED"
                                ? "text-emerald-400"
                                : "text-sky-400"
                          }`}>
                            {log.title}
                          </strong>
                          <p className="text-slate-300 mt-0.5 text-[10px]">{log.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Karar Log Defteri */}
              <ExecutionConsole logs={executions} />
              
            </div>

          </div>
        ) : viewMode === "siber_karargah" ? (
          <div className="space-y-6">
            <SiberKarargah
              siberState={siberState}
              backupWallet="0x0f4Bdc545e811060c48B7f16029e5580cB70a680"
              onRefreshSiber={fetchState}
            />
            <CommandCenter
              contractAddress={config.contractAddress}
              forceExecutionThreshold={config.forceExecutionThreshold}
              minProfitThreshold={config.minProfitThreshold}
              maxGasThreshold={config.maxGasThreshold}
              skipProfitCheck={config.skipProfitCheck}
              gasPriorityFee={50}
              gasMaxFee={250}
            />
          </div>
        ) : (
          /* Solidity Kod Gösterici */
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex items-center gap-3">
              <Code2 className="text-yellow-500 w-6 h-6" />
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Solidity Derleme & Test Yapısı</h2>
                <p className="text-xs text-slate-400 mt-0.5">Üretim aşamasına hazır Polygon Multi-Asset Aave V3 flaş kredi akıllı kontratlarını inceleyin.</p>
              </div>
            </div>
            
            <ContractConsole />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 px-6 mt-12 bg-opacity-70 text-center">
        <p className="text-xs text-slate-500 font-mono tracking-tight uppercase">
          AFETİ DEVRAN KONTROL ARAYÜZÜ V5.0.0 (NET KAZANÇ MODU) • MAĞDUR RAPORLU • Polygon Mainnet
        </p>
      </footer>
    </div>
  );
}
