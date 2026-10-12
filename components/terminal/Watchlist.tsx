"use client";
// components/terminal/Watchlist.tsx

import { useState } from "react";
import { Search, Star, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TickerData } from "@/hooks/useMarketFeed";

interface WatchlistProps {
  tickers: Record<string, TickerData>;
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

const SECTOR_LABELS: Record<string, string> = {
  FPT: "CNTT",
  HPG: "Thép",
  VCB: "NH",
  SSI: "CK",
  MWG: "BL",
  TCB: "NH",
  VHM: "BĐS",
  VIC: "BĐS",
  VNM: "F&B",
  MSN: "TP",
};

export default function Watchlist({ tickers, selectedSymbol, onSelect }: WatchlistProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "VN30" | "UP" | "DOWN">("ALL");

  const symbols = Object.keys(tickers).filter((s) => {
    const matchQuery = s.includes(query.toUpperCase());
    if (!matchQuery) return false;
    if (filter === "UP") return tickers[s].changePct >= 0;
    if (filter === "DOWN") return tickers[s].changePct < 0;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0c0e14] border-r border-white/10">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Danh Mục Theo Dõi
          </span>
          <Star size={12} className="text-yellow-400" />
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã CK..."
            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        {/* Filter Tabs */}
        <div className="flex gap-1 mt-2">
          {(["ALL", "VN30", "UP", "DOWN"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1 rounded text-[9px] font-bold transition-all ${
                filter === f
                  ? f === "UP"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : f === "DOWN"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-white/5 text-slate-500 border border-transparent hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5">
        <span className="text-[9px] text-slate-600 uppercase tracking-widest w-16">Mã</span>
        <span className="text-[9px] text-slate-600 uppercase tracking-widest text-right flex-1">Giá</span>
        <span className="text-[9px] text-slate-600 uppercase tracking-widest text-right w-16">%Thay Đổi</span>
      </div>

      {/* Ticker Rows */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {symbols.map((sym) => {
            const t = tickers[sym];
            const isSelected = sym === selectedSymbol;
            const isPos = t.changePct >= 0;

            return (
              <motion.button
                key={sym}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelect(sym)}
                className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-white/5 transition-all cursor-pointer group ${
                  isSelected
                    ? "bg-cyan-500/10 border-l-2 border-l-cyan-400"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex flex-col items-start w-16">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? "text-cyan-300" : "text-white"
                    }`}
                  >
                    {sym}
                  </span>
                  <span className="text-[8px] text-slate-600 font-medium">
                    {SECTOR_LABELS[sym] ?? "VN30"}
                  </span>
                </div>

                <div className="flex-1 text-right">
                  <motion.span
                    key={t.price}
                    initial={{ color: isPos ? "#00F59B" : "#FF3B69" }}
                    animate={{ color: "#ffffff" }}
                    transition={{ duration: 0.8 }}
                    className="text-xs font-mono font-semibold"
                  >
                    {t.price.toLocaleString("vi-VN")}
                  </motion.span>
                </div>

                <div className="w-16 text-right">
                  <span
                    className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                      isPos ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPos ? (
                      <ChevronUp size={10} />
                    ) : (
                      <ChevronDown size={10} />
                    )}
                    {isPos ? "+" : ""}
                    {t.changePct.toFixed(2)}%
                  </span>
                  <span className="text-[8px] text-slate-600 font-mono">
                    {(t.volume / 1000).toFixed(0)}K
                  </span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10">
        <p className="text-[9px] text-slate-600 text-center font-medium">
          {symbols.length} mã · VN30 Bluechips · Paper Mode
        </p>
      </div>
    </div>
  );
}
