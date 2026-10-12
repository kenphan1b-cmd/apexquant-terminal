"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, DollarSign, RefreshCcw, Sparkles, TrendingDown, TrendingUp, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import type { IndexData } from "@/src/types/market";
import { formatMoneyVND } from "@/src/types/market";

interface HeaderProps {
  indices: IndexData[];
  cashBalance: number;
  isConnected: boolean;
  onOpenCopilot: () => void;
  onResetCapital: () => void;
}

function ServerClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const syncClock = () => {
      const now = new Date();
      const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      setTime(vnTime.toLocaleTimeString("vi-VN", { hour12: false }));
    };

    syncClock();
    const interval = window.setInterval(syncClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return <span className="font-mono text-[10px] text-cyan-300">{time} ICT</span>;
}

function IndexTicker({ index }: { index: IndexData }) {
  const positive = index.changePct >= 0;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
      <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500">{index.name}</span>
      <span className="text-sm font-bold text-white">{index.value.toFixed(2)}</span>
      <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
        {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {positive ? "+" : "-"}
        {Math.abs(index.changePct).toFixed(2)}%
      </span>
    </div>
  );
}

export default function Header({ indices, cashBalance, isConnected, onOpenCopilot, onResetCapital }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#080a0f] px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 font-black text-black shadow-lg shadow-emerald-500/20">
          A
        </div>
        <div>
          <div className="text-sm font-black tracking-wide text-white">ApexQuant</div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-slate-500">Terminal</div>
        </div>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        {indices.map((index) => (
          <IndexTicker key={index.name} index={index} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-slate-300">
          <Clock3 size={12} className="text-cyan-400" />
          <ServerClock />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-3 py-1.5 text-emerald-400">
          <DollarSign size={12} />
          <span className="font-mono text-[10px] font-bold">{formatMoneyVND(cashBalance)}</span>
        </div>

        <button
          type="button"
          onClick={onResetCapital}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/15"
          aria-label="Nạp lại vốn 500 triệu"
          title="Nạp lại vốn 500 triệu"
        >
          <RefreshCcw size={10} />
          Nạp lại vốn 500tr
        </button>

        <div className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${isConnected ? "border-emerald-500/40 bg-emerald-900/15 text-emerald-400" : "border-rose-500/40 bg-rose-900/15 text-rose-400"}`}>
          <Wifi size={11} className={isConnected ? "animate-pulse" : ""} />
          {isConnected ? "Live" : "Offline"}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenCopilot}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-violet-500/30"
        >
          <Sparkles size={12} className="text-yellow-300" />
          AI Copilot
          <AnimatePresence>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="rounded-full bg-yellow-300 px-1.5 py-0.5 text-[8px] font-black text-black"
            >
              NEW
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </header>
  );
}
