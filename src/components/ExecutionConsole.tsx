import React from "react";
import { ListFilter, ExternalLink, ShieldAlert, Cpu, CheckCircle2, AlertOctagon, HelpCircle } from "lucide-react";
import { ExecutionLog, LogStatus } from "../types";

interface ExecutionConsoleProps {
  logs: ExecutionLog[];
}

export default function ExecutionConsole({ logs }: ExecutionConsoleProps) {
  const getStatusBadge = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS:
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold text-xs uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" /> Başarılı İşlem
          </span>
        );
      case LogStatus.SKIPPED_GAS:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700 text-xs uppercase">
            <Cpu className="w-3.5 h-3.5" /> Ön Kontrol İptal
          </span>
        );
      case LogStatus.FAILED_REVERT_PREVENTED:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20 text-xs uppercase">
            <ShieldAlert className="w-3.5 h-3.5" /> Zırh Devrede (Revert)
          </span>
        );
      case LogStatus.BROADCAST_REVERTED:
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full border border-rose-500/20 text-xs font-semibold uppercase">
            <AlertOctagon className="w-3.5 h-3.5" /> Sapma İptali
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-xs animate-pulse uppercase">
            Tarama Devam Ediyor
          </span>
        );
    }
  };

  const getLogClasses = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS:
        return "border-emerald-500/25 bg-emerald-950/10";
      case LogStatus.BROADCAST_REVERTED:
        return "border-rose-500/20 bg-rose-950/5";
      case LogStatus.FAILED_REVERT_PREVENTED:
        return "border-amber-500/20 bg-amber-950/5";
      default:
        return "border-slate-800 bg-slate-900/40";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-full flex flex-col">
      {/* Başlık */}
      <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListFilter className="text-emerald-400 w-4.5 h-4.5" />
          <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
            Otonom İşlem ve Karar Defteri (V4 Logs)
          </h3>
        </div>
        <div className="text-[11px] text-zinc-400 bg-slate-900 px-2.5 py-1 border border-slate-800 rounded font-mono">
          Kayıt Sayısı: {logs.length}
        </div>
      </div>

      {/* Akış Kanalları */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[500px] space-y-3">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 h-full">
            <HelpCircle className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
            <p className="font-sans text-xs">Pozitif arbitraj fırsatı tetikleme kararları bekleniyor...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 border rounded-xl transition duration-200 ${getLogClasses(log.status)}`}
            >
              <div className="flex flex-wrap justify-between items-start gap-2.5 mb-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-100 text-sm tracking-tight">
                    {log.tokenPairName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>{getStatusBadge(log.status)}</div>
              </div>

              {/* Rapor Panel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-850 font-mono text-[11px] text-slate-400 mb-2.5">
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase tracking-wide">Ödünç Alınan Flaş (Aave)</span>
                  <span className="text-slate-200 font-medium">${log.borrowedAmountUsd.toLocaleString()} USDC</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase tracking-wide">Ödenen Gas Ücreti</span>
                  <span className="text-slate-200 font-medium">${log.gasCostUsd.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase tracking-wide">Brüt Gelir</span>
                  <span className={log.grossProfitUsd > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                    ${log.grossProfitUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase tracking-wide">Kasaya Net Getiri</span>
                  <span className={log.netProfitUsd > 0 ? "text-emerald-400 font-extrabold" : "text-slate-400"}>
                    ${log.netProfitUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Açıklama Kutusu */}
              <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850/40 font-mono text-[11px]">
                {log.notes}
              </p>

              {/* Hash Değeri */}
              {log.txHash && (
                <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    TX GÖSTERGESİ: <code className="text-emerald-400 select-all font-mono text-[10px]">{log.txHash.substring(0, 30)}...</code>
                  </span>
                  <a
                    href={`https://polygonscan.com/tx/${log.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded transition font-sans"
                  >
                    PolygonScan Detayı <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500">
        Özel MEV korumalı imzalama altyapısı cüzdanı sandıkta izole eder
      </div>
    </div>
  );
}
