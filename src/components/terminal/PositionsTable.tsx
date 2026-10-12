"use client";

import { motion } from "framer-motion";
import type { PositionRecord } from "@/src/types/market";
import { formatMoneyVND } from "@/src/types/market";

interface PositionsTableProps {
  positions: PositionRecord[];
  onClose: (positionId: string) => void;
  onOpenAutopsy: (position: PositionRecord) => void;
}

export default function PositionsTable({ positions, onClose, onOpenAutopsy }: PositionsTableProps) {
  return (
    <div className="flex h-full flex-col bg-[#0c0e14]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Vị thế</span>
        <span className="text-[9px] text-slate-500">{positions.length} đang mở</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-[10px] text-slate-300">
          <thead className="sticky top-0 bg-[#0c0e14]">
            <tr className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Lô</th>
              <th className="px-3 py-2">Giá vào</th>
              <th className="px-3 py-2">Hiện tại</th>
              <th className="px-3 py-2">PnL</th>
              <th className="px-3 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  Chưa có vị thế đang mở.
                </td>
              </tr>
            )}

            {positions.map((position) => (
              <tr key={position.id} className="border-t border-white/5">
                <td className="px-3 py-2 font-bold text-white">{position.symbol}</td>
                <td className="px-3 py-2">{position.qty}</td>
                <td className="px-3 py-2 font-mono">{position.entryPrice.toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 font-mono">{position.currentPrice.toLocaleString("vi-VN")}</td>
                <td className={`px-3 py-2 font-bold ${position.unrealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatMoneyVND(position.unrealizedPnL)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onClose(position.id)}
                      className="rounded-md bg-rose-500/15 px-2 py-1 text-[9px] font-bold text-rose-400"
                    >
                      Đóng
                    </button>
                    {position.unrealizedPnL < 0 && (
                      <button
                        type="button"
                        onClick={() => onOpenAutopsy(position)}
                        className="rounded-md bg-violet-500/15 px-2 py-1 text-[9px] font-bold text-violet-300"
                      >
                        ⚡ Khám Sai
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
