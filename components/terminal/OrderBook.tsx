"use client";
// components/terminal/OrderBook.tsx

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OrderBookEntry, Trade } from "@/hooks/useMarketFeed";

interface OrderBookProps {
  orderBook: OrderBookEntry[];
  recentTrades: Trade[];
  spread: number;
  midPrice: number;
}

export default function OrderBook({
  orderBook,
  recentTrades,
  midPrice,
}: OrderBookProps) {
  const bids = useMemo(
    () =>
      orderBook
        .filter((e) => e.side === "bid")
        .sort((a, b) => b.price - a.price)
        .slice(0, 10),
    [orderBook]
  );

  const asks = useMemo(
    () =>
      orderBook
        .filter((e) => e.side === "ask")
        .sort((a, b) => a.price - b.price)
        .slice(0, 10),
    [orderBook]
  );

  const maxBidVol = Math.max(...bids.map((b) => b.volume), 1);
  const maxAskVol = Math.max(...asks.map((a) => a.volume), 1);
  const spread = asks[0] && bids[0] ? asks[0].price - bids[0].price : 0;

  return (
    <div className="flex flex-col h-full bg-[#0c0e14] overflow-hidden">
      {/* Title */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Sổ Lệnh (Level-2)
        </span>
        <span className="text-[9px] text-slate-600 font-mono">
          Spread: {spread.toLocaleString("vi-VN")}
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-[9px] text-slate-600 uppercase tracking-widest border-b border-white/5">
        <span>Giá Mua</span>
        <span className="text-center">KL</span>
        <span className="text-right">Tổng</span>
      </div>

      {/* Ask side (reversed, top = best ask) */}
      <div className="flex-none">
        <AnimatePresence>
          {asks
            .slice()
            .reverse()
            .map((entry) => (
              <motion.div
                key={`ask-${entry.price}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative grid grid-cols-3 px-3 py-[3px] text-[10px] font-mono group hover:bg-white/5 cursor-default"
              >
                {/* Depth bar */}
                <div
                  className="absolute right-0 top-0 h-full bg-rose-500/10 transition-all"
                  style={{ width: `${(entry.volume / maxAskVol) * 100}%` }}
                />
                <span className="relative z-10 text-rose-400 font-semibold">
                  {entry.price.toLocaleString("vi-VN")}
                </span>
                <span className="relative z-10 text-center text-slate-400">
                  {(entry.volume / 1000).toFixed(1)}K
                </span>
                <span className="relative z-10 text-right text-slate-600">
                  {((entry.depth ?? 0) / 1000).toFixed(0)}K
                </span>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Mid price */}
      <div className="px-3 py-2 bg-white/5 border-y border-white/10 flex items-center justify-between">
        <span className="text-base font-black font-mono text-white">
          {midPrice.toLocaleString("vi-VN")}
        </span>
        <span className="text-[9px] text-slate-500 font-medium">Giá Khớp</span>
        <span className="text-[10px] text-slate-400 font-mono">
          Spread {spread.toLocaleString("vi-VN")}
        </span>
      </div>

      {/* Bid side */}
      <div className="flex-none">
        <AnimatePresence>
          {bids.map((entry) => (
            <motion.div
              key={`bid-${entry.price}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative grid grid-cols-3 px-3 py-[3px] text-[10px] font-mono hover:bg-white/5 cursor-default"
            >
              <div
                className="absolute left-0 top-0 h-full bg-emerald-500/10 transition-all"
                style={{ width: `${(entry.volume / maxBidVol) * 100}%` }}
              />
              <span className="relative z-10 text-emerald-400 font-semibold">
                {entry.price.toLocaleString("vi-VN")}
              </span>
              <span className="relative z-10 text-center text-slate-400">
                {(entry.volume / 1000).toFixed(1)}K
              </span>
              <span className="relative z-10 text-right text-slate-600">
                {((entry.depth ?? 0) / 1000).toFixed(0)}K
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Recent Trades */}
      <div className="flex-1 overflow-y-auto mt-1 border-t border-white/10">
        <div className="px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-[#0c0e14]">
          Lịch Sử Khớp Lệnh
        </div>
        <div className="grid grid-cols-3 px-3 py-0.5 text-[9px] text-slate-700 border-b border-white/5">
          <span>Giá</span>
          <span className="text-center">KL</span>
          <span className="text-right">Loại</span>
        </div>
        <AnimatePresence>
          {recentTrades.slice(0, 15).map((trade) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: -4, backgroundColor: trade.side === "buy" ? "#00F59B33" : "#FF3B6933" }}
              animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-3 px-3 py-[3px] text-[10px] font-mono border-b border-white/5"
            >
              <span
                className={
                  trade.side === "buy" ? "text-emerald-400" : "text-rose-400"
                }
              >
                {trade.price.toLocaleString("vi-VN")}
              </span>
              <span className="text-center text-slate-400">
                {(trade.volume / 1000).toFixed(1)}K
              </span>
              <span
                className={`text-right text-[9px] font-bold uppercase ${
                  trade.side === "buy"
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {trade.side === "buy" ? "MUA" : "BÁN"}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
