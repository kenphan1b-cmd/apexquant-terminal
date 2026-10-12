"use client";

import { Search, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_OPTIONS, STOCKS } from "@/src/data/stocksData";
import type { StockCategory, TickerData } from "@/src/types/market";

interface WatchlistProps {
  tickers: Record<string, TickerData>;
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  priceFlash?: Record<string, "up" | "down">;
}

function miniSparkline(values: number[]) {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 42;
      const y = 12 - ((value - min) / range) * 12 + 2;
      return `${x},${y}`;
    })
    .join(" ");
  return points;
}

export default function Watchlist({ tickers, selectedSymbol, onSelect, priceFlash = {} }: WatchlistProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<StockCategory>("Tất Cả");
  const [liveTickers, setLiveTickers] = useState<Record<string, TickerData>>(tickers);

  useEffect(() => {
    setLiveTickers(tickers);
  }, [tickers]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveTickers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((symbol) => {
          const current = next[symbol];
          if (!current || Math.random() > 0.6) {
            return;
          }

          const deltaPercent = (Math.random() - 0.48) * 0.4;
          const tickStep = current.price > 100000 ? 50 : current.price > 50000 ? 10 : 5;
          const newPrice = Math.round((current.price * (1 + deltaPercent / 100)) / tickStep) * tickStep;
          const newChange = Number((current.change + deltaPercent).toFixed(2));
          const newChangePct = Number((current.changePct + deltaPercent * 0.9).toFixed(2));

          next[symbol] = {
            ...current,
            price: newPrice,
            change: newChange,
            changePct: newChangePct,
            high: Math.max(current.high, newPrice),
            low: Math.min(current.low, newPrice),
            isUp: newChange >= 0,
            lastUpdated: Date.now(),
          };
        });

        return next;
      });
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const visibleStocks = useMemo(() => {
    return STOCKS.filter((stock) => {
      const symbolMatch = stock.symbol.toLowerCase().includes(query.toLowerCase());
      const categoryMatch =
        activeCategory === "Tất Cả" || stock.category === activeCategory;
      return symbolMatch && categoryMatch;
    });
  }, [activeCategory, query]);

  return (
    <aside className="flex h-full w-full min-w-0 flex-col overflow-hidden border-r border-white/10 bg-[#0c0e14]">
      <div className="border-b border-white/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Watchlist</span>
          <Star size={12} className="text-yellow-400" />
        </div>

        <label className="relative block">
          <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã CK..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-7 pr-2 text-[11px] text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </label>

        <div className="mt-2 flex flex-wrap gap-1">
          {CATEGORY_OPTIONS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] transition ${activeCategory === category ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-transparent bg-white/5 text-slate-500 hover:text-slate-300"}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[44px_1fr_70px] border-b border-white/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-slate-600">
        <span>Mã</span>
        <span className="text-right">Giá</span>
        <span className="text-right">%Δ</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {visibleStocks.map((stock) => {
            const current = liveTickers[stock.symbol] ?? tickers[stock.symbol] ?? {
              symbol: stock.symbol,
              price: stock.price,
              changePct: 0,
              change: 0,
              volume: 0,
            };
            const points = miniSparkline(
              Array.from({ length: 14 }, (_, index) => {
                const wave = Math.sin(index / 2) * 120 + Math.cos(index / 3) * 80;
                return current.price + wave * (index % 2 === 0 ? 1 : -1);
              })
            );
            const positive = current.changePct >= 0;
            const isSelected = selectedSymbol === stock.symbol;
            const flashDirection = priceFlash[stock.symbol] ?? (current.lastUpdated && Date.now() - current.lastUpdated < 600 ? (current.isUp ? "up" : "down") : null);
            const flashClass = flashDirection === "up"
              ? "bg-emerald-500/10 ring-1 ring-emerald-400/30 animate-pulse"
              : flashDirection === "down"
                ? "bg-rose-500/10 ring-1 ring-rose-400/30 animate-pulse"
                : "";

            return (
              <motion.button
                layout
                key={stock.symbol}
                type="button"
                onClick={() => onSelect(stock.symbol)}
                className={`flex w-full items-center gap-2 border-b border-white/5 px-3 py-2 text-left transition ${isSelected ? "bg-cyan-500/8" : "hover:bg-white/5"} ${flashClass}`}
              >
                <div className="flex w-[44px] flex-col">
                  <span className={`text-xs font-black ${isSelected ? "text-cyan-300" : "text-white"}`}>{stock.symbol}</span>
                  <span className="text-[8px] text-slate-600">{stock.sector}</span>
                </div>

                <div className="flex flex-1 items-center justify-end gap-2">
                  <svg viewBox="0 0 42 14" className="h-[14px] w-[42px]">
                    <polyline
                      points={points}
                      fill="none"
                      stroke={positive ? "#10B981" : "#EF4444"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-mono text-xs font-bold text-white">
                    {current.price.toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="w-[70px] text-right">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                    {positive ? "▲" : "▼"}
                    {Math.abs(current.changePct).toFixed(2)}%
                  </span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
