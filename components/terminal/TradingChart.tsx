"use client";
// components/terminal/TradingChart.tsx
// Canvas-based candlestick renderer with volume histogram and SMA/EMA overlays

import { useEffect, useRef, useState, useCallback } from "react";
import type { CandleData, TickerData } from "@/hooks/useMarketFeed";

interface TradingChartProps {
  symbol: string;
  ticker: TickerData;
  candles: CandleData[];
}

type Timeframe = "1M" | "5M" | "15M" | "1H" | "1D";

const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  "1M": "1 Phút",
  "5M": "5 Phút",
  "15M": "15 Phút",
  "1H": "1 Giờ",
  "1D": "1 Ngày",
};

type IndicatorType = "SMA20" | "EMA20" | "VOL";

function calcSMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function calcEMA(data: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = Array(data.length).fill(null);
  let ema = data[0];
  result[0] = ema;
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    if (i >= period - 1) result[i] = ema;
  }
  return result;
}

export default function TradingChart({ symbol, ticker, candles }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("5M");
  const [indicators, setIndicators] = useState<Set<IndicatorType>>(
    new Set(["SMA20", "VOL"])
  );

  const toggleIndicator = useCallback((ind: IndicatorType) => {
    setIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind);
      else next.add(ind);
      return next;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio ?? 1;
    const width = container.clientWidth;
    const volPaneH = indicators.has("VOL") ? 60 : 0;
    const height = container.clientHeight - 48; // subtract toolbar
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const data = candles.slice(-80);
    if (data.length === 0) return;

    const chartH = height - volPaneH - (volPaneH > 0 ? 8 : 0);
    const padding = { top: 20, right: 60, bottom: 20, left: 8 };
    const chartW = width - padding.left - padding.right;

    const closes = data.map((c) => c.close);
    const highs = data.map((c) => c.high);
    const lows = data.map((c) => c.low);
    const vols = data.map((c) => c.volume);

    const priceMin = Math.min(...lows) * 0.999;
    const priceMax = Math.max(...highs) * 1.001;
    const volMax = Math.max(...vols);

    const toX = (i: number) =>
      padding.left + (i / (data.length - 1)) * chartW;
    const toY = (price: number) =>
      padding.top + ((priceMax - price) / (priceMax - priceMin)) * (chartH - padding.top - padding.bottom);
    const toVolY = (vol: number) =>
      height - volPaneH + volPaneH * (1 - vol / volMax) - 4;

    // Background
    ctx.fillStyle = "#080a0f";
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    const gridSteps = 6;
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSteps; i++) {
      const y = toY(priceMin + ((priceMax - priceMin) * i) / gridSteps);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      // Price label
      const label = (priceMin + ((priceMax - priceMin) * i) / gridSteps)
        .toLocaleString("vi-VN");
      ctx.fillStyle = "rgba(100,116,139,0.8)";
      ctx.font = "10px 'SF Mono', 'Fira Code', monospace";
      ctx.textAlign = "right";
      ctx.fillText(label, width - 4, y + 4);
    }

    const candleW = Math.max(2, (chartW / data.length) * 0.7);

    // SMA / EMA lines
    if (indicators.has("SMA20")) {
      const sma = calcSMA(closes, 20);
      ctx.strokeStyle = "#00E5FF";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
      ctx.beginPath();
      let started = false;
      data.forEach((_, i) => {
        if (sma[i] === null) return;
        const x = toX(i);
        const y = toY(sma[i]!);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    if (indicators.has("EMA20")) {
      const ema = calcEMA(closes, 20);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      let started = false;
      data.forEach((_, i) => {
        if (ema[i] === null) return;
        const x = toX(i);
        const y = toY(ema[i]!);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Volume histogram
    if (indicators.has("VOL")) {
      data.forEach((c, i) => {
        const isUp = c.close >= c.open;
        ctx.fillStyle = isUp ? "rgba(0,245,155,0.35)" : "rgba(255,59,105,0.35)";
        const x = toX(i) - candleW / 2;
        const barH = height - toVolY(c.volume) - 4;
        ctx.fillRect(x, toVolY(c.volume), candleW, Math.max(1, barH));
      });
    }

    // Candles
    data.forEach((c, i) => {
      const isUp = c.close >= c.open;
      const color = isUp ? "#00F59B" : "#FF3B69";
      const x = toX(i);
      const openY = toY(c.open);
      const closeY = toY(c.close);
      const highY = toY(c.high);
      const lowY = toY(c.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(1, Math.abs(closeY - openY));
      ctx.fillStyle = isUp ? "#00F59B" : "#FF3B69";
      if (isUp) {
        ctx.fillStyle = "#00F59B";
        ctx.globalAlpha = 0.85;
      } else {
        ctx.fillStyle = "#FF3B69";
        ctx.globalAlpha = 0.85;
      }
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
      ctx.globalAlpha = 1;
    });

    // Last price line
    if (closes.length > 0) {
      const lastPrice = closes[closes.length - 1];
      const lastY = toY(lastPrice);
      const isPos = ticker.changePct >= 0;
      ctx.strokeStyle = isPos ? "#00F59B" : "#FF3B69";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(width - padding.right, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price badge
      const badgeText = lastPrice.toLocaleString("vi-VN");
      const badgeW = 58;
      ctx.fillStyle = isPos ? "#00F59B" : "#FF3B69";
      ctx.fillRect(width - padding.right + 2, lastY - 10, badgeW, 20);
      ctx.fillStyle = "#000";
      ctx.font = "bold 10px 'SF Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(badgeText, width - padding.right + 2 + badgeW / 2, lastY + 4);
    }
  }, [candles, ticker, indicators]);

  const isPos = ticker.changePct >= 0;

  return (
    <div className="flex flex-col h-full bg-[#080a0f]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">{symbol}</span>
          <span
            className={`text-lg font-mono font-bold ${
              isPos ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {ticker.price.toLocaleString("vi-VN")}
          </span>
          <span
            className={`text-xs font-semibold ${
              isPos ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isPos ? "▲" : "▼"} {isPos ? "+" : ""}
            {ticker.change.toLocaleString("vi-VN")} ({isPos ? "+" : ""}
            {ticker.changePct.toFixed(2)}%)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Timeframes */}
          <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
            {(["1M", "5M", "15M", "1H", "1D"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                title={TIMEFRAME_LABEL[tf]}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  timeframe === tf
                    ? "bg-cyan-500 text-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
            {(["SMA20", "EMA20", "VOL"] as IndicatorType[]).map((ind) => (
              <button
                key={ind}
                onClick={() => toggleIndicator(ind)}
                className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                  indicators.has(ind)
                    ? ind === "SMA20"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      : ind === "EMA20"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "text-slate-600 hover:text-slate-400"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-t border-white/10 bg-[#0c0e14] text-[10px] font-mono">
        {[
          ["O", ticker.open?.toLocaleString("vi-VN") ?? "—"],
          ["H", ticker.high?.toLocaleString("vi-VN") ?? "—"],
          ["L", ticker.low?.toLocaleString("vi-VN") ?? "—"],
          ["VOL", (ticker.volume / 1000).toFixed(0) + "K"],
        ].map(([label, value]) => (
          <span key={label} className="text-slate-500">
            <span className="text-slate-600">{label} </span>
            <span className="text-slate-300">{value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
