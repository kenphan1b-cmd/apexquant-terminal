"use client";

import { useEffect, useState } from "react";

interface FundamentalsData {
  ticker: string;
  pe?: number | null;
  pb?: number | null;
  roe?: number | null;
  marketCap?: number | null;
  foreignNetBuy?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
}

export default function FundamentalsBar({ activeTicker }: { activeTicker: string }) {
  const [data, setData] = useState<FundamentalsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTicker) {
      setData(null);
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/market/fundamentals?ticker=${encodeURIComponent(activeTicker)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Fundamentals request failed: ${response.status}`);
        }

        const json = await response.json();
        if (!ignore) {
          setData(json?.data ?? null);
        }
      } catch (error) {
        if (!ignore && !(error instanceof DOMException && error.name === "AbortError")) {
          setData(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [activeTicker]);

  const foreignNetBuy = Number(data?.foreignNetBuy ?? 0);
  const isForeignBuy = foreignNetBuy >= 0;
  const weekHigh = Number(data?.week52High ?? 0);
  const weekLow = Number(data?.week52Low ?? 0);
  const rangeWidth = weekHigh > weekLow ? ((Number(data?.week52High ?? 0) - Number(data?.week52Low ?? 0)) / Math.max(weekHigh, 1)) * 100 : 0;

  return (
    <div className="border-b border-white/10 bg-[#0a0d12]/90 px-3 py-2 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Fundamentals</div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Metric value="P/E" number={data?.pe != null ? Number(data.pe).toFixed(2) : "—"} />
          <Metric value="P/B" number={data?.pb != null ? Number(data.pb).toFixed(2) : "—"} />
          <Metric value="ROE" number={data?.roe != null ? `${Number(data.roe).toFixed(1)}%` : "—"} />
          <Metric value="Vốn hóa" number={data?.marketCap != null ? `${Number(data.marketCap).toFixed(1)}T` : "—"} />

          <div className={`rounded-full border px-2 py-1 text-[10px] font-bold font-mono ${isForeignBuy ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
            {foreignNetBuy >= 0 ? "KHỐI NGOẠI MUA" : "KHỐI NGOẠI BÁN"} {Math.abs(foreignNetBuy).toLocaleString("vi-VN")} tỷ
          </div>

          <div className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 font-mono text-[10px] text-cyan-300">
            <span className="text-slate-500">52W</span>
            <span>{weekLow > 0 ? weekLow.toLocaleString("vi-VN") : "—"}</span>
            <span className="text-slate-500">→</span>
            <span>{weekHigh > 0 ? weekHigh.toLocaleString("vi-VN") : "—"}</span>
          </div>
        </div>
      </div>

      {loading && <div className="mt-2 text-[9px] uppercase tracking-[0.2em] text-slate-500">Đang nạp định giá…</div>}
      {!loading && data && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full ${foreignNetBuy >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
            style={{ width: `${Math.min(100, Math.max(10, rangeWidth))}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Metric({ value, number }: { value: string; number: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-slate-300">
      <span className="text-slate-500">{value}</span>
      <span className="ml-1 font-black text-white">{number}</span>
    </div>
  );
}
