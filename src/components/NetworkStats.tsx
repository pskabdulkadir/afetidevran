import React from "react";
import { Server, Zap, Shield, Activity } from "lucide-react";

interface NetworkStatsProps {
  currentBlockNumber: number;
  gasPriceGwei: number;
  maticPriceUsd: number;
  lastScannedAt: string;
}

export default function NetworkStats({
  currentBlockNumber,
  gasPriceGwei,
  maticPriceUsd,
  lastScannedAt
}: NetworkStatsProps) {
  const isGasSpiked = gasPriceGwei > 150;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Blok Yüksekliği */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Server className="w-5 h-5" />
        </div>
        <div>
          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            POLYGON BLOK NO
          </span>
          <strong className="text-slate-100 font-mono text-xs block mt-0.5">
            #{currentBlockNumber.toLocaleString()}
          </strong>
        </div>
      </div>

      {/* Gas Ücreti */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg border ${
          isGasSpiked 
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }`}>
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            ANLIK GAS ÜCRETİ
          </span>
          <strong className={`font-mono text-xs block mt-0.5 ${
            isGasSpiked ? "text-rose-400" : "text-emerald-400"
          }`}>
            {gasPriceGwei} Gwei
          </strong>
        </div>
      </div>

      {/* POL (MATIC) Kuru */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            POL (MATIC) ENDEKSİ
          </span>
          <strong className="text-slate-100 font-mono text-xs block mt-0.5">
            ${maticPriceUsd.toFixed(3)}
          </strong>
        </div>
      </div>

      {/* Güvenlik Kanalları */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <Shield className="w-5 h-5 animate-bounce" />
        </div>
        <div>
          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            İŞLEM TARZI
          </span>
          <strong className="text-yellow-400 font-mono text-xs block mt-0.5 truncate max-w-[125px]">
            MEV Korumalı RPC
          </strong>
        </div>
      </div>
    </div>
  );
}
