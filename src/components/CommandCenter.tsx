import React, { useState } from "react";
import { Terminal, Send, CheckCircle2, AlertCircle, Zap } from "lucide-react";

interface CommandCenterProps {
  contractAddress?: string;
  forceExecutionThreshold?: number;
  minProfitThreshold?: number;
  maxGasThreshold?: number;
  skipProfitCheck?: boolean;
}

export default function CommandCenter({
  contractAddress = "0x0000000000000000000000000000000000000000",
  forceExecutionThreshold = 0,
  minProfitThreshold = 0.01,
  maxGasThreshold = 500000,
  skipProfitCheck = false
}: CommandCenterProps) {
  const [commands, setCommands] = useState<Array<{ command: string; timestamp: string; status: "pending" | "success" | "error"; message: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [authorizationAddr, setAuthorizationAddr] = useState(contractAddress);
  const [thresholdValue, setThresholdValue] = useState(forceExecutionThreshold.toString());
  const [minProfitValue, setMinProfitValue] = useState(minProfitThreshold.toString());
  const [maxGasValue, setMaxGasValue] = useState(maxGasThreshold.toString());
  const [skipProfitValue, setSkipProfitValue] = useState(skipProfitCheck);

  const sendCommand = async (command: string, params?: Record<string, any>) => {
    setLoading(true);
    const newCmd = { command, timestamp: new Date().toLocaleTimeString("tr-TR"), status: "pending" as const, message: "Gönderiliyor..." };
    setCommands(prev => [newCmd, ...prev.slice(0, 19)]);

    try {
      const res = await fetch("/api/siber/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, params })
      });

      const data = await res.json();
      setCommands(prev => [
        { ...prev[0], status: data.success ? "success" : "error", message: data.message },
        ...prev.slice(1)
      ]);
    } catch (err) {
      setCommands(prev => [
        { ...prev[0], status: "error", message: err instanceof Error ? err.message : "Hata oluştu" },
        ...prev.slice(1)
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeSetExecutionMode = async () => {
    await sendCommand("SET_EXECUTION_MODE", { mode: "LIVE_MODE_ENABLED" });
  };

  const executeContractAuthorize = async () => {
    if (!authorizationAddr.startsWith("0x") || authorizationAddr.length !== 42) {
      alert("Geçerli bir Ethereum adresi girin (0x ile başlaması ve 42 karakter olması gerekir)");
      return;
    }
    await sendCommand("CONTRACT_AUTHORIZE", { address: authorizationAddr });
  };

  const executeTokenApprovals = async () => {
    await sendCommand("TRIGGER_CONTRACT_APPROVALS", { tokens: "USDC_WETH_GNS_QUICK" });
  };

  const executeForceThreshold = async () => {
    const threshold = parseFloat(thresholdValue);
    if (isNaN(threshold) || threshold < 0) {
      alert("Geçerli bir sayı girin");
      return;
    }
    await sendCommand("FORCE_EXECUTION_THRESHOLD", { threshold });
  };

  const executeEnableExecutionEngine = async () => {
    await sendCommand("ENABLE_EXECUTION_ENGINE", { mode: "ACTIVE" });
  };

  const executeSyncContractInterface = async () => {
    await sendCommand("SYNC_CONTRACT_INTERFACE", {});
  };

  const executeSetMinProfit = async () => {
    await sendCommand("SET_MIN_PROFIT", { minProfit: 0.0000000001 });
  };

  const executeSetMinProfitThreshold = async () => {
    const value = parseFloat(minProfitValue);
    if (isNaN(value) || value < 0) {
      alert("Geçerli bir sayı girin (ör: 0.01)");
      return;
    }
    await sendCommand("SET_MIN_PROFIT_THRESHOLD", { minProfitThreshold: value });
  };

  const executeSetMaxGasThreshold = async () => {
    const value = parseFloat(maxGasValue);
    if (isNaN(value) || value < 0) {
      alert("Geçerli bir sayı girin (ör: 500000)");
      return;
    }
    await sendCommand("SET_MAX_GAS_THRESHOLD", { maxGasThreshold: value });
  };

  const executeToggleSkipProfitCheck = async () => {
    await sendCommand("TOGGLE_SKIP_PROFIT_CHECK", { skipProfitCheck: !skipProfitValue });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Terminal className="w-4 h-4 text-yellow-500" />
        <h3 className="font-black text-sm text-slate-100 uppercase tracking-wide">SİBER KARARGÂH KOMUT MERKEZİ</h3>
      </div>

      {/* Execution Mode Command */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">1. EXECUTION MODE AKTIFLEŞTIR</span>
          <p className="text-[11px] text-slate-400 mb-3">Botun otomatik işlem tetikleme modunu canlı hale getirir.</p>
        </div>
        <button
          onClick={executeSetExecutionMode}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Zap className="w-4 h-4" />
          SET_EXECUTION_MODE: LIVE_MODE_ENABLED
        </button>
      </div>

      {/* Contract Authorization */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">2. KONTRAKTı YETKİLENDİR</span>
          <p className="text-[11px] text-slate-400 mb-3">Deployed arbitrage kontratını sisteme tanıtır ve tetikleme izni verir.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={authorizationAddr}
            onChange={(e) => setAuthorizationAddr(e.target.value)}
            placeholder="0x69b48825DA1e62b76DCFab0201bDe0a1752a3841"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded placeholder-slate-600 focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={executeContractAuthorize}
            disabled={loading}
            className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center gap-2 transition whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            YETKİLENDİR
          </button>
        </div>
      </div>

      {/* Token Approvals */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">3. TOKEN ONAYLARINI TETIKLE</span>
          <p className="text-[11px] text-slate-400 mb-3">Kontratın USDC, WETH, GNS tokenleri üzerinde işlem yapabilmesi için onay verme işlemini başlatır.</p>
        </div>
        <button
          onClick={executeTokenApprovals}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Zap className="w-4 h-4" />
          TRIGGER_CONTRACT_APPROVALS: USDC_WETH_GNS_QUICK
        </button>
      </div>

      {/* Force Execution Threshold */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">4. KÂR SINIRLAMA EŞIĞINI ZORLA</span>
          <p className="text-[11px] text-slate-400 mb-3">Bot, minimumun altında kâr olsa bile işlemi tetiklemek için bu değeri ayarla. Test için: 0.00000000001</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={thresholdValue}
            onChange={(e) => setThresholdValue(e.target.value)}
            placeholder="0.00000000001"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={executeForceThreshold}
            disabled={loading}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center gap-2 transition whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            AYARLA
          </button>
        </div>
      </div>

      {/* ENABLE_EXECUTION_ENGINE */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">5. YÜRÜTME MOTORUNU DEVREYE AL</span>
          <p className="text-[11px] text-slate-400 mb-3">Sistem "İzleme" modundan "Aktif Kazanım" moduna geçer. [PATROL] → [ENGAGE]</p>
        </div>
        <button
          onClick={executeEnableExecutionEngine}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Zap className="w-4 h-4" />
          ENABLE_EXECUTION_ENGINE: TRUE
        </button>
      </div>

      {/* SYNC_CONTRACT_INTERFACE */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">6. KONTRAKTı AĞ İLE SENKRONIZE ET</span>
          <p className="text-[11px] text-slate-400 mb-3">Kontrat adresini PolygonScan ile doğrula ve ağ senkronizasyonunu tamamla.</p>
        </div>
        <button
          onClick={executeSyncContractInterface}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Send className="w-4 h-4" />
          SYNC_CONTRACT_INTERFACE
        </button>
      </div>

      {/* SET_MIN_PROFIT */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">7. ULTRA-AGRESIF KÂR MODUNU AKTIFLEŞTIR</span>
          <p className="text-[11px] text-slate-400 mb-3">Bot en küçük farklarda bile (%0.001) işlem başlatacak. FORCE_EXECUTION_THRESHOLD + minSpreadThreshold sıfıra yakın ayarlanır.</p>
        </div>
        <button
          onClick={executeSetMinProfit}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Zap className="w-4 h-4" />
          SET_MIN_PROFIT: 0.0000000001
        </button>
      </div>

      {/* ENVIRONMENT VARIABLES SETTINGS */}
      <div className="border-t border-slate-800 pt-4 mt-4">
        <h4 className="text-xs font-black text-yellow-500 uppercase tracking-wider mb-4">⚙️ ORTAM DEĞİŞKENLERİ (Environment Variables)</h4>

        {/* MIN_PROFIT_THRESHOLD */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 mb-3">
          <div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">Minimum Kâr Eşiği (MIN_PROFIT_THRESHOLD)</span>
            <p className="text-[11px] text-slate-400 mb-3">İşlem başlatılması için gerekli minimum net kâr (USD). Varsayılan: $0.01</p>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={minProfitValue}
              onChange={(e) => setMinProfitValue(e.target.value)}
              placeholder="0.01"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={executeSetMinProfitThreshold}
              disabled={loading}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center gap-2 transition whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              GÜNCELLE
            </button>
          </div>
        </div>

        {/* MAX_GAS_THRESHOLD */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 mb-3">
          <div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">Maksimum Gas Limiti (MAX_GAS_THRESHOLD)</span>
            <p className="text-[11px] text-slate-400 mb-3">İşlem için harcayacak maksimum gas limiti. Varsayılan: 500000</p>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="10000"
              value={maxGasValue}
              onChange={(e) => setMaxGasValue(e.target.value)}
              placeholder="500000"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded placeholder-slate-600 focus:outline-none focus:border-lime-500"
            />
            <button
              onClick={executeSetMaxGasThreshold}
              disabled={loading}
              className="px-4 py-2.5 bg-lime-600 hover:bg-lime-500 disabled:bg-slate-700 text-white font-black text-xs uppercase rounded-lg flex items-center gap-2 transition whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              GÜNCELLE
            </button>
          </div>
        </div>

        {/* SKIP_PROFIT_CHECK */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
          <div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">Kârlılık Kontrolünü Atla (SKIP_PROFIT_CHECK)</span>
            <p className="text-[11px] text-slate-400 mb-3">Etkinleştirilirse, bot kâr kontrolü yapmadan tüm işlemleri tetikler. UYARI: Risklidir!</p>
          </div>
          <button
            onClick={executeToggleSkipProfitCheck}
            disabled={loading}
            className={`w-full px-4 py-2.5 font-black text-xs uppercase rounded-lg flex items-center justify-center gap-2 transition ${
              skipProfitValue
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-slate-700 hover:bg-slate-600"
            } disabled:bg-slate-700 text-white`}
          >
            <Zap className="w-4 h-4" />
            {skipProfitValue ? "❌ ATLANIYYOR - DEVRE DIŞI BIR" : "✅ ATLANMIYOR - KONTROL AKTIF"}
          </button>
        </div>
      </div>

      {/* Command Log */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 max-h-[200px] overflow-y-auto">
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Komut Geçmişi</span>
        {commands.length === 0 ? (
          <p className="text-xs text-slate-500">Henüz komut gönderilmedi...</p>
        ) : (
          commands.map((cmd, idx) => (
            <div key={idx} className="text-xs font-mono text-slate-400 flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                {cmd.status === "success" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {cmd.status === "error" && <AlertCircle className="w-3 h-3 text-rose-400" />}
                {cmd.status === "pending" && <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />}
              </div>
              <div className="flex-1">
                <div className="text-slate-300">{cmd.timestamp} - {cmd.command}</div>
                <div className={cmd.status === "success" ? "text-emerald-400" : cmd.status === "error" ? "text-rose-400" : "text-yellow-400"}>{cmd.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
