"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import FundamentalsBar from "@/src/components/terminal/FundamentalsBar";
import type { CandleData, TickerData } from "@/src/types/market";

interface TradingChartProps {
  symbol: string;
  ticker: TickerData;
  candles: CandleData[];
  flashDirection?: "up" | "down" | null;
}

type Timeframe = "1M" | "5M" | "15M" | "1D";

function toIsoDay(value: number | string): string {
  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
    if (match) {
      return match[0];
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value * 1000);
    return date.toISOString().slice(0, 10);
  }

  return "1970-01-01";
}

function toChartTime(value: number | string): Time {
  const iso = toIsoDay(value);
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day } as Time;
}

function nextDayTime(value: number | string): Time {
  const iso = toIsoDay(value);
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  const nextIso = date.toISOString().slice(0, 10);
  return toChartTime(nextIso);
}

function dedupeCandles(candles: CandleData[]): CandleData[] {
  const byDate = new Map<string, CandleData>();

  for (const candle of candles) {
    const time = String(candle.time ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(time) || !Number.isFinite(candle.close) || candle.close <= 0) {
      continue;
    }

    const nextCandle: CandleData = {
      ...candle,
      time,
      open: Number(candle.open) || 0,
      high: Number(candle.high) || 0,
      low: Number(candle.low) || 0,
      close: Number(candle.close) || 0,
      volume: Number(candle.volume) || 0,
    };

    const current = byDate.get(time);
    if (!current || String(current.time).localeCompare(time) < 0) {
      byDate.set(time, nextCandle);
    }
  }

  return Array.from(byDate.values()).sort((a, b) => String(a.time).localeCompare(String(b.time)));
}

function aggregateCandles(candles: CandleData[], timeframe: Timeframe): CandleData[] {
  const validCandles = dedupeCandles(candles);

  if (validCandles.length === 0) {
    return [];
  }

  if (timeframe === "1D") {
    return validCandles;
  }

  const lookback = timeframe === "1M" ? 30 : timeframe === "5M" ? 60 : 90;
  return validCandles.slice(-lookback);
}

export default function TradingChart({ symbol, ticker, candles, flashDirection = null }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [crosshair, setCrosshair] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const previousSymbolRef = useRef<string | null>(null);
  const hasFitInitialViewRef = useRef(false);
  const lastAppliedSeriesKeyRef = useRef<string | null>(null);

  const hasIntradayData = useMemo(
    () => candles.some((entry) => {
      const timeValue = toIsoDay(entry.time);
      const date = new Date(`${timeValue}T00:00:00Z`);
      return date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0;
    }),
    [candles]
  );

  const aggregatedCandles = useMemo(() => aggregateCandles(candles, timeframe), [candles, timeframe]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    if (!aggregatedCandles.length) {
      return;
    }

    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    const chartData = dedupeCandles(aggregatedCandles)
      .map((entry) => ({
        time: toChartTime(entry.time),
        open: Number(entry.open),
        high: Number(entry.high),
        low: Number(entry.low),
        close: Number(entry.close),
        volume: Number(entry.volume) || 0,
      }))
      .filter((entry) => Number.isFinite(entry.open) && Number.isFinite(entry.close) && Number.isFinite(entry.high) && Number.isFinite(entry.low));

    if (chartData.length === 0) {
      return;
    }

    const candlePoints = chartData.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }));
    const volumePoints = chartData.map(({ time, open, close, volume }) => ({
      time,
      value: volume,
      color: close >= open ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
    }));

    const currentSeriesKey = JSON.stringify({
      symbol,
      count: chartData.length,
      lastTime: chartData[chartData.length - 1]?.time ?? null,
    });

    const symbolChanged = previousSymbolRef.current !== symbol;
    const shouldResetSeries = symbolChanged || lastAppliedSeriesKeyRef.current !== currentSeriesKey;

    if (shouldResetSeries) {
      candleSeries.setData(candlePoints);
      volumeSeries.setData(volumePoints);
    } else {
      const lastCandle = candlePoints[candlePoints.length - 1];
      const lastVolume = volumePoints[volumePoints.length - 1];

      if (lastCandle) {
        candleSeries.update({
          time: lastCandle.time,
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close,
        });
      }

      if (lastVolume) {
        volumeSeries.update({
          time: lastVolume.time,
          value: lastVolume.value,
          color: lastVolume.color,
        });
      }
    }

    lastAppliedSeriesKeyRef.current = currentSeriesKey;
    previousSymbolRef.current = symbol;

    if (!hasFitInitialViewRef.current || symbolChanged) {
      chartRef.current?.timeScale().fitContent();
      hasFitInitialViewRef.current = true;
    }
  }, [aggregatedCandles, symbol]);

  useEffect(() => {
    if ((timeframe === "1M" || timeframe === "5M" || timeframe === "15M") && !hasIntradayData) {
      setNotice("Dữ liệu nến phút khả dụng trong phiên giao dịch");
      setTimeframe("1D");
      return;
    }

    if (timeframe !== "1D") {
      setNotice(null);
    }
  }, [hasIntradayData, timeframe]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#080a0f" },
        textColor: "#cbd5e1",
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        timeVisible: true,
        rightOffset: 12,
        barSpacing: 12,
        minBarSpacing: 1.5,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
      priceLineVisible: false,
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#10B981",
      priceScaleId: "",
      priceFormat: { type: "volume" },
    });
    volumeSeriesRef.current = volumeSeries;

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const smaSeries = chart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const emaSeries = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const referenceSeries = chart.addSeries(LineSeries, {
      color: "#F59E0B",
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const ceilingSeries = chart.addSeries(LineSeries, {
      color: "#FF00FF",
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const floorSeries = chart.addSeries(LineSeries, {
      color: "#06B6D4",
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const chartPoints = aggregatedCandles
      .map((entry) => ({
        time: toChartTime(entry.time),
        open: Number(entry.open),
        high: Number(entry.high),
        low: Number(entry.low),
        close: Number(entry.close),
        volume: Number(entry.volume) || 0,
      }))
      .filter((entry) => Number.isFinite(entry.open) && Number.isFinite(entry.close) && Number.isFinite(entry.high) && Number.isFinite(entry.low));

    if (chartPoints.length > 0) {
      candleSeries.setData(chartPoints.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
      volumeSeries.setData(chartPoints.map(({ time, open, close, volume }) => ({
        time,
        value: volume,
        color: close >= open ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
      })));
      volumeSeriesRef.current = volumeSeries;
    }

    const smaData: Array<{ time: Time; value: number }> = [];
    for (let index = 19; index < aggregatedCandles.length; index += 1) {
      const window = aggregatedCandles.slice(index - 19, index + 1).map((entry) => Number(entry.close)).filter((value) => Number.isFinite(value));
      if (window.length < 20) continue;
      const average = window.reduce((sum, value) => sum + value, 0) / window.length;
      smaData.push({ time: toChartTime(aggregatedCandles[index].time), value: average });
    }
    if (smaData.length > 0) {
      smaSeries.setData(smaData);
    }

    const emaData: Array<{ time: Time; value: number }> = [];
    let previousMovingAverage: number | null = null;
    const alpha = 2 / (50 + 1);
    for (let index = 0; index < aggregatedCandles.length; index += 1) {
      const value = Number(aggregatedCandles[index].close);
      if (!Number.isFinite(value)) continue;

      if (previousMovingAverage === null) {
        previousMovingAverage = value;
        continue;
      }

      previousMovingAverage = value * alpha + previousMovingAverage * (1 - alpha);
      emaData.push({ time: toChartTime(aggregatedCandles[index].time), value: previousMovingAverage });
    }
    if (emaData.length > 0) {
      emaSeries.setData(emaData);
    }

    const lastBarDate = aggregatedCandles[aggregatedCandles.length - 1]?.time ?? "1970-01-01";
    const referenceData = [
      { time: toChartTime(lastBarDate), value: ticker.referencePrice },
      { time: nextDayTime(lastBarDate), value: ticker.referencePrice },
    ];
    const ceilingData = [
      { time: toChartTime(lastBarDate), value: ticker.ceilingPrice },
      { time: nextDayTime(lastBarDate), value: ticker.ceilingPrice },
    ];
    const floorData = [
      { time: toChartTime(lastBarDate), value: ticker.floorPrice },
      { time: nextDayTime(lastBarDate), value: ticker.floorPrice },
    ];

    referenceSeries.setData(referenceData);
    ceilingSeries.setData(ceilingData);
    floorSeries.setData(floorData);

    const priceScale = chart.priceScale("right");
    priceScale.applyOptions({ scaleMargins: { top: 0.1, bottom: 0.18 } });

    chart.subscribeCrosshairMove((param) => {
      const candle = param.seriesData.get(candleSeries) as { time?: Time; open?: number; high?: number; low?: number; close?: number } | undefined;
      const volumePoint = param.seriesData.get(volumeSeries) as { value?: number } | undefined;
      if (!candle || typeof candle.open !== "number") return;

      const rawTime = candle.time;
      const timeValue = typeof rawTime === "string"
        ? rawTime
        : typeof rawTime === "number"
          ? toIsoDay(rawTime)
          : rawTime && typeof rawTime === "object"
            ? `${String((rawTime as { year?: number }).year ?? 1970).padStart(4, "0")}-${String((rawTime as { month?: number }).month ?? 1).padStart(2, "0")}-${String((rawTime as { day?: number }).day ?? 1).padStart(2, "0")}`
            : "1970-01-01";

      setCrosshair({
        time: timeValue,
        open: candle.open,
        high: candle.high ?? candle.open,
        low: candle.low ?? candle.open,
        close: candle.close ?? candle.open,
        volume: volumePoint?.value ?? 0,
      });
    });

    const resize = () => {
      chart.applyOptions({
        width: containerRef.current?.clientWidth ?? 0,
        height: containerRef.current?.clientHeight ?? 0,
      });
    };

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
      if (chartRef.current === chart) {
        chartRef.current = null;
      }
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      previousSymbolRef.current = null;
      hasFitInitialViewRef.current = false;
      lastAppliedSeriesKeyRef.current = null;
    };
  }, []);

  const positive = ticker.changePct >= 0;

  return (
    <div className={`flex h-full flex-col transition-colors duration-500 ${flashDirection === "up" ? "bg-emerald-500/5" : flashDirection === "down" ? "bg-rose-500/5" : "bg-[#080a0f]"}`}>
      <FundamentalsBar activeTicker={symbol} />

      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">{symbol}</span>
          <span className={`text-xl font-mono font-black transition-all duration-500 ${flashDirection === "up" ? "text-emerald-300 animate-pulse" : flashDirection === "down" ? "text-rose-300 animate-pulse" : positive ? "text-emerald-400" : "text-rose-400"}`}>

            {ticker.price.toLocaleString("vi-VN")}
          </span>
          <span className={`text-[10px] font-bold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
            {positive ? "+" : "-"}
            {Math.abs(ticker.changePct).toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          {(["1M", "5M", "15M", "1D"] as Timeframe[]).map((button) => (
            <button
              key={button}
              type="button"
              onClick={() => {
                if ((button === "1M" || button === "5M" || button === "15M") && !hasIntradayData) {
                  setNotice("Dữ liệu nến phút khả dụng trong phiên giao dịch");
                  setTimeframe("1D");
                  return;
                }

                setNotice(null);
                setTimeframe(button);
              }}
              className={`rounded-md px-2 py-1 text-[10px] font-bold ${timeframe === button ? "bg-cyan-500 text-black" : "text-slate-400 hover:text-white"}`}
            >
              [{button}]
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-2 py-1 text-center text-[10px] font-medium text-amber-200">
          {notice}
        </div>
      )}

      <div className="relative flex-1">
        <div ref={containerRef} className="h-full w-full" />
        {crosshair && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-[#0f172a]/90 px-2 py-1.5 text-[10px] text-slate-200 shadow-xl shadow-black/20">
            <div className="font-bold text-cyan-300">{crosshair.time}</div>
            <div className="mt-1 space-y-0.5">
              <div>O: {crosshair.open.toLocaleString("vi-VN")}</div>
              <div>H: {crosshair.high.toLocaleString("vi-VN")}</div>
              <div>L: {crosshair.low.toLocaleString("vi-VN")}</div>
              <div>C: {crosshair.close.toLocaleString("vi-VN")}</div>
              <div>V: {crosshair.volume.toLocaleString("vi-VN")}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
