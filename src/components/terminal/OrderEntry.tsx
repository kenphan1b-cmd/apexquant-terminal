"use client";

import { useMemo, useState } from "react";
import { formatMoneyVND, getTickStep, normalizeLot, snapToTick } from "@/src/types/market";
import type { TickerData } from "@/src/types/market";

interface OrderEntryProps {
  symbol: string;
  ticker: TickerData;
  cashBalance: number;
  onPlaceOrder: (symbol: string, side: "buy" | "sell", qty: number, price: number) => { ok: boolean; message: string };
}

export default function OrderEntry({ symbol, ticker, cashBalance, onPlaceOrder }: OrderEntryProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState<number>(100);
  const [price, setPrice] = useState<number>(ticker.price);
  const [status, setStatus] = useState<string>("");

  useMemo(() => {
    setPrice(snapToTick(ticker.price));
  }, [ticker.price]);

  const orderValue = quantity * price;
  const fee = orderValue * 0.0015;
  const finalAmount = side === "buy" ? orderValue + fee : Math.max(0, orderValue - fee);
  const validQuantity = normalizeLot(quantity);

  const submit = () => {
    const result = onPlaceOrder(symbol, side, validQuantity, price);
    setStatus(result.message);
  };

  return (
    <div className="flex h-full flex-col bg-[#0c0e14] p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Lệnh</div>
          <div className="text-xl font-black text-white">{symbol}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Tài sản</div>
          <div className="font-mono text-sm font-bold text-emerald-400">{formatMoneyVND(cashBalance)}</div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {(["buy", "sell"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSide(value)}
            className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition ${side === value ? (value === "buy" ? "bg-emerald-500 text-black" : "bg-rose-500 text-white") : "bg-white/5 text-slate-400"}`}
          >
            {value === "buy" ? "Mua" : "Bán"}
          </button>
        ))}
      </div>

      <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-slate-500">
        Số lượng (100 cổ phiếu/lô)
        <input
          type="number"
          value={quantity}
          step={100}
          min={100}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-cyan-500/40 focus:outline-none"
        />
      </label>

      <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-slate-500">
        Giá giới hạn
        <input
          type="number"
          value={price}
          step={getTickStep(price)}
          onChange={(event) => setPrice(Number(event.target.value))}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-cyan-500/40 focus:outline-none"
        />
      </label>

      <div className="mb-3 rounded-xl border border-white/10 bg-[#111827] p-3 text-[10px] text-slate-300">
        <div className="flex items-center justify-between"><span>Giá khớp</span><span className="font-mono">{snapToTick(price).toLocaleString("vi-VN")}</span></div>
        <div className="flex items-center justify-between"><span>Giá trị</span><span className="font-mono">{formatMoneyVND(orderValue)}</span></div>
        <div className="flex items-center justify-between"><span>Phí</span><span className="font-mono">{formatMoneyVND(fee)}</span></div>
        <div className="flex items-center justify-between"><span>Thực nhận</span><span className="font-mono">{formatMoneyVND(finalAmount)}</span></div>
      </div>

      <button
        type="button"
        onClick={submit}
        className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${side === "buy" ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"}`}
      >
        {side === "buy" ? "Đặt mua" : "Đặt bán"}
      </button>

      {status && (
        <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2 text-[10px] text-cyan-200">
          {status}
        </div>
      )}
    </div>
  );
}
