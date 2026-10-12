"use client";

import { useMemo } from "react";
import type { OrderBookEntry, TradeRecord } from "@/src/types/market";

interface OrderBookProps {
  orderBook: OrderBookEntry[];
  recentTrades: TradeRecord[];
  midPrice: number;
}

export default function OrderBook({ orderBook, recentTrades, midPrice }: OrderBookProps) {
  const bids = useMemo(
    () => orderBook.filter((entry) => entry.side === "bid").sort((a, b) => b.price - a.price).slice(0, 3),
    [orderBook]
  );
  const asks = useMemo(
    () => orderBook.filter((entry) => entry.side === "ask").sort((a, b) => a.price - b.price).slice(0, 3),
    [orderBook]
  );

  const bestAsk = asks[0]?.price ?? midPrice;
  const bestBid = bids[0]?.price ?? midPrice;
  const spread = bestAsk - bestBid;
  const lastTrade = recentTrades[0];
  const changePct = lastTrade ? ((lastTrade.price - midPrice) / midPrice) * 100 : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-white/10 bg-[#0c0e14]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sổ lệnh</span>
        <span className="text-[9px] text-slate-400 font-mono">Spread {spread.toLocaleString("vi-VN")}</span>
      </div>

      <div className="space-y-2 p-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-slate-500">
            <span>Dư Mua</span>
            <span>KL</span>
          </div>
          <div className="space-y-1 text-[10px] font-mono">
            {[...bids].reverse().map((entry, index) => (
              <div key={`bid-${entry.price}`} className="grid grid-cols-[1fr_1fr] items-center gap-3">
                <span className="text-emerald-400">[{index + 1}] {entry.price.toLocaleString("vi-VN")}</span>
                <span className="text-right text-slate-300">{entry.volume.toLocaleString("vi-VN")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-2">
          <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-slate-500">
            <span>Khớp lệnh</span>
            <span>{Math.abs(changePct).toFixed(2)}%</span>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-[10px] font-mono text-slate-200">
            <span className="text-emerald-400">{lastTrade?.price.toLocaleString("vi-VN") ?? "-"}</span>
            <span>{lastTrade?.qty.toLocaleString("vi-VN") ?? "-"}</span>
            <span className={changePct >= 0 ? "text-emerald-400" : "text-rose-400"}>{changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-slate-500">
            <span>Dư Bán</span>
            <span>KL</span>
          </div>
          <div className="space-y-1 text-[10px] font-mono">
            {asks.map((entry, index) => (
              <div key={`ask-${entry.price}`} className="grid grid-cols-[1fr_1fr] items-center gap-3">
                <span className="text-rose-400">[{index + 1}] {entry.price.toLocaleString("vi-VN")}</span>
                <span className="text-right text-slate-300">{entry.volume.toLocaleString("vi-VN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-white/10 bg-[#111827] px-3 py-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-white">{midPrice.toLocaleString("vi-VN")}</span>
          <span className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Giá khớp</span>
        </div>
      </div>
    </div>
  );
}
