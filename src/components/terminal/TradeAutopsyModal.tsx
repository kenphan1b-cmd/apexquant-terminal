"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { AutopsyReport, PositionRecord } from "@/src/types/market";

interface TradeAutopsyModalProps {
  isOpen: boolean;
  position: PositionRecord | null;
  onClose: () => void;
}

export default function TradeAutopsyModal({ isOpen, position, onClose }: TradeAutopsyModalProps) {
  const [report, setReport] = useState<AutopsyReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !position) return;

    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/copilot/autopsy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: position.symbol,
            pnl: position.unrealizedPnL,
            qty: position.qty,
            entryPrice: position.entryPrice,
            currentPrice: position.currentPrice,
            side: position.side,
          }),
        });

        const data = (await response.json()) as { report?: AutopsyReport };
        setReport(data.report ?? null);
      } catch (error) {
        setReport({
          headline: "Đánh giá thất trận do sai kỹ thuật và kiểm soát rủi ro.",
          dimensions: [
            { title: "Lỗi kỹ thuật", verdict: "Cần xem lại phân tích vào điểm kháng cự", detail: "Vị thế đã vào lúc thị trường đang áp lực, không xác nhận phá vỡ và không có kiểm soát vốn." },
            { title: "Lỗi vốn", verdict: "Over-commit trong 1 cổ phiếu", detail: "Tỷ lệ đầu tư vượt mức khuyến nghị khi đã đang chịu áp lực bán tháo." },
            { title: "Bẫy tâm lý F0", verdict: "FOMO / revenge trading", detail: "Vị thế tiếp tục kéo dài sau khi dòng tiền đã đổi chiều." },
          ],
          checklist: [
            "Xác nhận giá đang ở vùng hỗ trợ/kháng cự và không mua ở tâm lý FOMO.",
            "Tách rủi ro theo vốn: mỗi cổ phiếu chỉ chiếm tối đa 30% tài sản khả dụng.",
            "Đặt stop-loss trước khi vào và không tăng vị thế sau khi thua.",
            "Đợi tín hiệu xác nhận mới và không giao dịch lại ngay sau khi thua.",
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isOpen, position]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-2xl rounded-2xl border border-violet-500/30 bg-[#0b1220] p-5 shadow-2xl shadow-violet-500/10"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-violet-300">Bác sĩ khám sai</div>
                <h3 className="text-xl font-black text-white">Vì sao tôi thua?</h3>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-sm text-slate-300">✕</button>
            </div>

            {loading && <div className="text-slate-300">Đang phân tích nguyên nhân thua lỗ...</div>}

            {report && (
              <div className="space-y-4">
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 text-sm font-semibold text-purple-200">
                  {report.headline}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {report.dimensions.map((dimension, index) => (
                    <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-slate-500">{dimension.title}</div>
                      <div className="text-sm font-bold text-white">{dimension.verdict}</div>
                      <div className="mt-2 text-[11px] leading-relaxed text-slate-300">{dimension.detail}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-amber-300">SOP chỉnh sửa</div>
                  <ol className="list-decimal space-y-2 pl-5 text-[11px] leading-relaxed text-slate-200">
                    {report.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
