"use client";
// components/terminal/Header.tsx

import { useEffect, useState } from "react";
import { Wifi, DollarSign, Clock, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { IndexData } from "@/hooks/useMarketFeed";

interface HeaderProps {
  indices: IndexData[];
  paperBalance: number;
  isConnected: boolean;
  onOpenCopilot: () => void;
}

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

function ServerClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const vn = new Date(now.getTime() + 7 * 3600 * 1000);
      setTime(
        vn.toISOString().replace("T", " ").substring(0, 19) + " ICT"
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono text-xs text-cyan-400">{time}</span>;
}

function IndexTicker({ idx }: { idx: IndexData }) {
  const isPos = idx.changePct >= 0;
  return (
    <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
      <span className="text-xs font-semibold text-slate-300">{idx.name}</span>
      <span className="text-sm font-bold text-white">{idx.value.toFixed(2)}</span>
      <motion.span
        key={idx.changePct}
        initial={{ opacity: 0, y: isPos ? -4 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-0.5 text-xs font-semibold ${
          isPos ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {isPos ? "+" : ""}
        {idx.changePct.toFixed(2)}%
      </motion.span>
    </div>
  );
}

export default function Header({
  indices,
  paperBalance,
  isConnected,
  onOpenCopilot,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#080a0f] border-b border-white/10 relative z-30 flex-wrap gap-2">
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-emerald-500/30">
            A
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#080a0f] animate-pulse" />
        </div>
        <div className="leading-none">
          <p className="text-white font-black text-sm tracking-tight">ApexQuant</p>
          <p className="text-slate-500 text-[9px] font-medium tracking-widest uppercase">Terminal</p>
        </div>
      </div>

      {/* Index Ticker */}
      <div className="flex items-center gap-2 flex-wrap">
        {indices.map((idx) => (
          <IndexTicker key={idx.name} idx={idx} />
        ))}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Clock */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock size={12} />
          <ServerClock />
        </div>

        {/* Balance */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30">
          <DollarSign size={12} className="text-emerald-400" />
          <span className="text-emerald-400 font-mono font-semibold text-xs">
            {formatVND(Math.round(paperBalance))}
          </span>
          <span className="text-emerald-600 text-[9px] font-medium">PAPER</span>
        </div>

        {/* WS Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold tracking-wider uppercase ${
            isConnected
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
              : "bg-rose-950/40 border-rose-500/40 text-rose-400"
          }`}
        >
          <Wifi size={11} className={isConnected ? "animate-pulse" : ""} />
          {isConnected ? "WS LIVE" : "OFFLINE"}
        </div>

        {/* AI Copilot Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenCopilot}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow border border-violet-400/30"
        >
          <Sparkles size={13} className="text-yellow-300 animate-pulse" />
          <span>Trợ Lý AI F0</span>
          <AnimatePresence>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-1.5 py-0.5 rounded-full bg-yellow-400 text-black text-[8px] font-black"
            >
              NEW
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </header>
  );
}
