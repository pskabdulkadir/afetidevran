import React from "react";
import { Search, Percent, TrendingUp, AlertCircle, Zap, Layers } from "lucide-react";
import { ArbitrageOpportunity } from "../types";

interface ScansTableProps {
  scans: ArbitrageOpportunity[];
  minSpread: number;
}

export default function ScansTable({ scans, minSpread }: ScansTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Başlık */}
      <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="text-yellow-500 w-4.5 h-4.5" />
          <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
            Canlı DEX Fiyat Tarayıcı Radar (7/24)
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 text-xs border border-slate-800 rounded-lg">
          <Percent className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-slate-400 font-sans">
            Kârlılık Hurdlesi: <strong className="text-slate-200">≥{minSpread}%</strong>
          </span>
        </div>
      </div>

      {/* Tablo İçeriği */}
      <div className="overflow-x-auto min-h-[300px]">
        {scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Zap className="w-8 h-8 text-slate-600 animate-bounce mb-3" />
            <p className="font-sans text-xs">Canlı Polygon bloklarının akması bekleniyor...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 font-mono text-[10px] tracking-wider uppercase border-b border-slate-850">
                <th className="py-3 px-4">Zaman</th>
                <th className="py-3 px-4">Borsa Geçiş Rotası</th>
                <th className="py-3 px-4">QuickSwap Fiyat</th>
                <th className="py-3 px-4">SushiSwap Fiyat</th>
                <th className="py-3 px-4 text-center">Fiyat Farkı</th>
                <th className="py-3 px-4 text-right">Tahmini Gas</th>
                <th className="py-3 px-4 text-right">Brüt Kâr</th>
                <th className="py-3 px-4 text-right">Net Getiri</th>
                <th className="py-3 px-4 text-center">Durum Sinyali</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-sans text-xs">
              {scans.map((scan) => {
                const matchesThreshold = scan.spreadPercent >= minSpread;
                const isProfitable = scan.isProfitable && matchesThreshold;

                return (
                  <tr
                    key={scan.id}
                    className={`hover:bg-slate-850/40 transition duration-150 ${
                      isProfitable ? "bg-emerald-950/20" : ""
                    }`}
                  >
                    {/* Time */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </td>

                    {/* Pair & Router design */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{scan.tokenPairName}</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-yellow-500/80" /> {scan.routeType}
                      </div>
                    </td>

                    {/* QuickSwap */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      ${scan.quickswapPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* SushiSwap */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      ${scan.sushiswapPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Spread */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono text-xs font-semibold ${
                          matchesThreshold
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        %{scan.spreadPercent.toFixed(2)}
                      </span>
                    </td>

                    {/* Gas Cost */}
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      ${scan.gasCostUsd.toFixed(2)}
                    </td>

                    {/* Gross */}
                    <td className={`py-3 px-4 text-right font-mono ${
                      scan.grossProfitUsd > 100 ? "text-slate-200 font-bold" : "text-slate-400"
                    }`}>
                      ${scan.grossProfitUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Net return */}
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold ${
                        isProfitable ? "text-emerald-400" : "text-slate-400"
                      }`}
                    >
                      ${scan.netProfitUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Sinyal */}
                    <td className="py-3 px-4 text-center">
                      {isProfitable ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-20 py-0.5 rounded border border-emerald-500/20 font-extrabold text-[10px] uppercase">
                          <TrendingUp className="w-3 h-3" /> FIRSAT VAR!
                        </span>
                      ) : scan.spreadPercent >= minSpread ? (
                        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 px-20 py-0.5 rounded border border-rose-500/20 text-[10px] uppercase" title="Brüt fark var ancak gas maliyeti geliri aşıyor!">
                          <AlertCircle className="w-3 h-3" /> GAS YÜKSEK
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-medium uppercase">Stabil</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
        <span>Görünüm: Son 15 döngüsel blok taraması listelenmektedir</span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          QuickSwap, SushiSwap ve Uniswap V3 havuzları izleniyor
        </span>
      </div>
    </div>
  );
}
