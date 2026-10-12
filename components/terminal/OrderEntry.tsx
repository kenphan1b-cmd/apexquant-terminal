"use client";
// components/terminal/OrderEntry.tsx

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Zap, TrendingUp, TrendingDown } from "lucide-react";
import type { TickerData } from "@/hooks/useMarketFeed";

interface OrderEntryProps {
  symbol: string;
  ticker: TickerData;
  paperBalance: number;
  onPlaceOrder: (
    symbol: string,
    side: "buy" | "sell",
    qty: number,
    price: number,
    type: "limit" | "market"
  ) => boolean;
}

type OrderType = "limit" | "market";
type Side = "buy" | "sell";

interface Toast {
  id: string;
  message: string;
  success: boolean;
}

export default function OrderEntry({
  symbol,
  ticker,
  paperBalance,
  onPlaceOrder,
}: OrderEntryProps) {
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [qty, setQty] = useState<string>("1000");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const price = orderType === "market" ? ticker.price : (parseFloat(limitPrice) || ticker.price);
  const estimatedCost = (parseInt(qty) || 0) * price * 0.0001; // scaled to USD paper
  const margin = (estimatedCost / paperBalance) * 100;

  const addToast = useCallback((message: string, success: boolean) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [{ id, message, success }, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleSubmit = useCallback(() => {
    const qtyNum = parseInt(qty);
    if (!qtyNum || qtyNum <= 0) {
      addToast("Số lượng không hợp lệ", false);
      return;
    }

    const execPrice = orderType === "market" ? ticker.price : parseFloat(limitPrice) || ticker.price;
    const success = onPlaceOrder(symbol, side, qtyNum, execPrice, orderType);

    if (success) {
      addToast(
        `✓ Lệnh ${side === "buy" ? "MUA" : "BÁN"} ${qtyNum.toLocaleString()} ${symbol} @ ${execPrice.toLocaleString("vi-VN")} đã khớp`,
        true
      );
    } else {
      addToast("Số dư không đủ để thực hiện lệnh", false);
    }
  }, [qty, orderType, limitPrice, ticker.price, onPlaceOrder, symbol, side, addToast]);

  return (
    <div className="flex flex-col h-full bg-[#0c0e14] overflow-hidden">
      {/* Toast notifications */}
      <div className="absolute top-14 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold shadow-xl ${
                t.success
                  ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
                  : "bg-rose-950/90 border-rose-500/50 text-rose-300"
              }`}
            >
              {t.success ? <CheckCircle size={13} /> : <XCircle size={13} />}
              <span className="max-w-[220px]">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Đặt Lệnh
        </span>
        <span className="text-[10px] font-mono text-cyan-400">{symbol}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {/* Buy / Sell toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button
            onClick={() => setSide("buy")}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-black uppercase transition-all ${
              side === "buy"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/30"
            }`}
          >
            <TrendingUp size={13} />
            Mua
          </button>
          <button
            onClick={() => setSide("sell")}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-black uppercase transition-all ${
              side === "sell"
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                : "text-slate-500 hover:text-rose-400 hover:bg-rose-950/30"
            }`}
          >
            <TrendingDown size={13} />
            Bán
          </button>
        </div>

        {/* Order type */}
        <div className="flex gap-1.5">
          {(["limit", "market"] as OrderType[]).map((ot) => (
            <button
              key={ot}
              onClick={() => setOrderType(ot)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                orderType === ot
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                  : "border-white/10 text-slate-500 hover:text-white hover:border-white/20"
              }`}
            >
              {ot === "limit" ? "Giới Hạn" : "Thị Trường"}
            </button>
          ))}
        </div>

        {/* Current price display */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[9px] text-slate-500 uppercase">Giá Hiện Tại</span>
          <span className="text-sm font-mono font-bold text-white">
            {ticker.price.toLocaleString("vi-VN")}
          </span>
        </div>

        {/* Limit price input */}
        <AnimatePresence>
          {orderType === "limit" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                Giá Đặt Lệnh (VNĐ)
              </label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={ticker.price.toString()}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quantity */}
        <div>
          <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
            Số Lượng (CP)
          </label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min="100"
            step="100"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
          <div className="flex gap-1 mt-1.5">
            {[500, 1000, 5000, 10000].map((q) => (
              <button
                key={q}
                onClick={() => setQty(String(q))}
                className="flex-1 py-1 rounded text-[8px] font-bold text-slate-500 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
              >
                {(q / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>

        {/* Cost estimate */}
        <div className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Giá trị lệnh</span>
            <span className="text-slate-300 font-mono font-semibold">
              {(parseInt(qty) * price || 0).toLocaleString("vi-VN")} VNĐ
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Ước tính (USD)</span>
            <span className="text-white font-mono font-bold">
              ${estimatedCost.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">% Số dư sử dụng</span>
            <span
              className={`font-mono font-bold ${
                margin > 80
                  ? "text-rose-400"
                  : margin > 50
                  ? "text-yellow-400"
                  : "text-emerald-400"
              }`}
            >
              {margin.toFixed(1)}%
            </span>
          </div>
          {/* Margin bar */}
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              animate={{ width: `${Math.min(margin, 100)}%` }}
              className={`h-full rounded-full transition-all ${
                margin > 80 ? "bg-rose-400" : margin > 50 ? "bg-yellow-400" : "bg-emerald-400"
              }`}
            />
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 transition-all shadow-lg ${
            side === "buy"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-emerald-500/30 hover:shadow-emerald-500/50"
              : "bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-rose-500/30 hover:shadow-rose-500/50"
          }`}
        >
          <Zap size={14} />
          {side === "buy" ? "Đặt Lệnh Mua" : "Đặt Lệnh Bán"} {symbol}
        </motion.button>

        {/* Balance remaining */}
        <div className="text-center text-[9px] text-slate-600">
          Số dư còn lại: <span className="text-slate-400 font-mono">${(paperBalance - (side === "buy" ? estimatedCost : 0)).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
