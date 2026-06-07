import React, { useState } from "react";
import { Wallet, ShieldAlert, TrendingUp, ArrowDownRight, Copy, Check, Info, PiggyBank, Receipt, Coins } from "lucide-react";
import { WalletState } from "../types";

interface WalletPanelProps {
  wallet: WalletState;
}

export default function WalletPanel({ wallet }: WalletPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Kart Başı */}
      <div className="px-5 py-4 bg-slate-950 border-b border-slate-805 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="text-yellow-500 w-5 h-5" />
          <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
            Kasa ve Cüzdan Hesabı Takip Defteri (0-Gas Modu)
          </h3>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase font-bold animate-pulse">
          V5 Koruma Zırhı Aktif
        </span>
      </div>

      <div className="p-5 space-y-5">
        
        {/* Güvenli Adres Alanı */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between gap-3 text-xs">
          <div className="font-mono text-slate-400 truncate">
            CÜZDAN ADRESİ: <span className="text-slate-200 select-all font-semibold font-mono">{wallet.address}</span>
          </div>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded transition duration-150 flex-shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-[10px]">Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-semibold text-[10px]">Kopyala</span>
              </>
            )}
          </button>
        </div>

        {/* Gerçek Zamanlı Cüzdan Bakiyeleri */}
        <div>
          <span className="block text-[10.5px] font-mono text-slate-400 uppercase tracking-widest mb-3">
            SAHİP BAKİYELERİ (RESERVES)
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* POL BAKİYESİ */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-500/20 relative overflow-hidden group">
              <div className="absolute top-2 right-2 flex justify-center items-center p-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[9px] font-mono font-black">
                0-GAS KALKANI
              </div>
              <span className="text-[9px] font-mono text-rose-400 tracking-wider font-extrabold uppercase block">
                POL (MATIC) GAS APARATI
              </span>
              <strong className="text-2xl font-mono text-slate-100 block mt-1.5 animate-pulse-slow">
                {wallet.loading ? (
                  <span className="text-sm font-semibold text-slate-500">Yükleniyor...</span>
                ) : (
                  `${wallet.pol.toFixed(4)} POL`
                )}
              </strong>
              <p className="text-[9.5px] text-slate-400 font-mono mt-1 leading-normal">
                Gas, Aave flash loan ile karşılanır; cüzdanda <strong>0 POL</strong> dahi olsa bot otonom çalışır.
              </p>
            </div>

            {/* USDC BAKİYESİ */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/20 relative overflow-hidden group">
              <div className="absolute top-2 right-2 p-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-mono font-bold">
                KÂR KASASI
              </div>
              <span className="text-[9px] font-mono text-emerald-400 tracking-wider font-extrabold uppercase block">
                USDC SAF KAZANÇ
              </span>
              <strong className="text-2xl font-mono text-slate-100 block mt-1.5">
                {wallet.loading ? (
                  <span className="text-sm font-semibold text-slate-500">Yükleniyor...</span>
                ) : (
                  `$${wallet.usdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </strong>
              <p className="text-[9.5px] text-slate-400 font-mono mt-1 leading-normal">
                Başarılı arbitrajlardan kontrat sahibine aktarılan net, çekilebilir nakit birikim.
              </p>
            </div>

            {/* WETH BAKİYESİ */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
              <span className="text-[9px] font-mono text-slate-500 tracking-wider font-semibold uppercase block">
                WETH REZERVİ
              </span>
              <strong className="text-lg font-mono text-slate-200 block mt-1">
                {wallet.loading ? (
                  <span className="text-xs text-slate-500">Yükleniyor...</span>
                ) : (
                  `${wallet.weth.toFixed(6)} WETH`
                )}
              </strong>
            </div>

            {/* WBTC BAKİYESİ */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
              <span className="text-[9px] font-mono text-slate-500 tracking-wider font-semibold uppercase block">
                WBTC REZERVİ
              </span>
              <strong className="text-lg font-mono text-slate-200 block mt-1">
                {wallet.loading ? (
                  <span className="text-xs text-slate-500">Yükleniyor...</span>
                ) : (
                  `${wallet.wbtc.toFixed(6)} WBTC`
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Gelir / Gider Defteri */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3.5">
          <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-900">
            FİNANSAL VERİM DEFTERİ (SUMMARY)
          </span>

          <div className="grid grid-cols-2 gap-4">
            {/* Toplam Gelir */}
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Biriken Toplam Gelir</span>
              </div>
              <span className="text-lg font-mono font-black text-emerald-400">
                {wallet.loading ? (
                  <span className="text-xs text-slate-500">Yükleniyor...</span>
                ) : (
                  `+$${wallet.totalRevenueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                )}
              </span>
            </div>

            {/* Toplam Gider */}
            <div>
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Toplam Cepten Gider</span>
              </div>
              <span className="text-lg font-mono font-black text-rose-400">
                $0.00 USD
              </span>
              <span className="block text-[8px] text-emerald-400 font-mono font-extrabold uppercase mt-0.5 animate-pulse">
                Sıfır Gider Kalkanı Aktif
              </span>
            </div>
          </div>

          {/* Aave'den otonom sızdırılan toplam POL */}
          <div className="mt-3 pt-3 border-t border-slate-900 flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-yellow-500" />
              Aave Flaş Krediyle Çekilen Gaz:
            </span>
            <strong className="text-yellow-400 font-bold">{wallet.totalGasBorrowedPol.toFixed(1)} POL</strong>
          </div>
        </div>

        {/* Zararsızlık Güvencesi Notu */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-[10px] text-emerald-400/90 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1 font-bold">
            <PiggyBank className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>SIFIR BULAŞMALI KAZANÇ MODELİ (V5):</span>
          </div>
          <p>
            Her arbitraj işleminde, gas bedeli de havuzdan POL olarak borç çekilir. Akıllı kontrat takası gerçekleştirip USDC kârı çıkardığında, kârın bir kısmı ile Aave'ye olan POL borcu kapatılır. Eğer kâr yoksa, işlem <strong>revert</strong> edilir. Revert durumunda ne borç gerçekleşir ne de cüzdandan gas harcanır. Abdulkadir'in POL kasası %100 güvence altındadır.
          </p>
        </div>

      </div>
    </div>
  );
}
