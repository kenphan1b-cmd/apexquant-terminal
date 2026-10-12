"use client";
// components/terminal/PositionsTable.tsx

import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import type { Position } from "@/hooks/useMarketFeed";

interface PositionsTableProps {
  positions: Position[];
  onClose: (id: string) => void;
}

export default function PositionsTable({ positions, onClose }: PositionsTableProps) {
  const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const hasPositions = positions.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#0c0e14] border-t border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 size={13} className="text-cyan-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Vị Thế Đang Mở
          </span>
          {hasPositions && (
            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[9px] font-bold">
              {positions.length}
            </span>
          )}
        </div>
        {hasPositions && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Tổng PnL:</span>
            <motion.span
              key={totalPnL}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className={`text-sm font-mono font-black ${
                totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </motion.span>
          </div>
        )}
      </div>

      {/* Table */}
      {hasPositions ? (
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {/* Column headers */}
          <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[9px] text-slate-600 uppercase tracking-widest border-b border-white/5 min-w-[700px]">
            <span>Mã</span>
            <span className="text-center">Loại</span>
            <span className="text-right">SL (CP)</span>
            <span className="text-right">Giá Vào</span>
            <span className="text-right">Giá Hiện Tại</span>
            <span className="text-right">PnL ($)</span>
            <span className="text-right">Thao Tác</span>
          </div>

          <AnimatePresence>
            {positions.map((pos) => {
              const isProfit = pos.unrealizedPnL >= 0;
              return (
                <motion.div
                  key={pos.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`grid grid-cols-7 gap-2 px-4 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors min-w-[700px] ${
                    isProfit ? "border-l-2 border-l-emerald-500/30" : "border-l-2 border-l-rose-500/30"
                  }`}
                >
                  {/* Symbol */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{pos.symbol}</span>
                  </div>

                  {/* Side */}
                  <div className="flex items-center justify-center">
                    <span
                      className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        pos.side === "buy"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {pos.side === "buy" ? (
                        <TrendingUp size={9} />
                      ) : (
                        <TrendingDown size={9} />
                      )}
                      {pos.side === "buy" ? "LONG" : "SHORT"}
                    </span>
                  </div>

                  {/* Qty */}
                  <span className="text-xs font-mono text-slate-300 text-right">
                    {pos.qty.toLocaleString()}
                  </span>

                  {/* Entry Price */}
                  <span className="text-xs font-mono text-slate-400 text-right">
                    {pos.entryPrice.toLocaleString("vi-VN")}
                  </span>

                  {/* Current Price */}
                  <motion.span
                    key={pos.currentPrice}
                    initial={{ color: isProfit ? "#00F59B" : "#FF3B69" }}
                    animate={{ color: "#e2e8f0" }}
                    transition={{ duration: 0.5 }}
                    className="text-xs font-mono text-right font-semibold"
                  >
                    {pos.currentPrice.toLocaleString("vi-VN")}
                  </motion.span>

                  {/* PnL */}
                  <div className="text-right">
                    <motion.div
                      key={pos.unrealizedPnL}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className={`text-xs font-mono font-black ${
                        isProfit ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isProfit ? "+" : ""}${pos.unrealizedPnL.toFixed(2)}
                    </motion.div>
                    <div
                      className={`text-[9px] font-semibold ${
                        isProfit ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isProfit ? "+" : ""}
                      {pos.unrealizedPnLPct.toFixed(2)}%
                    </div>
                  </div>

                  {/* Close button */}
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onClose(pos.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/30"
                      title="Đóng vị thế"
                    >
                      <X size={12} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 size={32} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 text-xs font-medium">Chưa có vị thế nào đang mở</p>
            <p className="text-slate-700 text-[10px] mt-0.5">Đặt lệnh mua/bán để bắt đầu giao dịch mô phỏng</p>
          </div>
        </div>
      )}
    </div>
  );
}
