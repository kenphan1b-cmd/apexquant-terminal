import { NextResponse } from "next/server";
import { STOCKS_BY_SYMBOL } from "@/src/data/stocksData";

const TCBS_HISTORY_URL = "https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term";

function safeNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function safeBarFromTcbs(raw: any) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const tradingDate = String(raw.tradingDate ?? raw.date ?? raw.day ?? raw.t ?? "");
  const time = tradingDate.slice(0, 10) || (raw.time ? String(raw.time).slice(0, 10) : "");
  const open = safeNumber(raw.open ?? raw.o, 0);
  const high = safeNumber(raw.high ?? raw.h, 0);
  const low = safeNumber(raw.low ?? raw.l, 0);
  const close = safeNumber(raw.close ?? raw.c, 0);
  const volume = safeNumber(raw.volume ?? raw.v, 0);

  if (!time || !Number.isFinite(open) || !Number.isFinite(close) || open <= 0 || close <= 0) {
    return null;
  }

  return {
    time,
    open,
    high,
    low,
    close,
    volume,
  };
}

function normalizeTcbsBars(rawData: unknown): Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> {
  const list = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.data)
      ? (rawData as any).data
      : [];

  const cleaned = list
    .map((bar: any) => safeBarFromTcbs(bar))
    .filter((bar: any): bar is { time: string; open: number; high: number; low: number; close: number; volume: number } => Boolean(bar));

  const unique = cleaned.filter((bar: any, index: number, self: any[]) => {
    const seen = new Set(self.map((entry: any) => entry.time));
    return self.findIndex((entry: any) => entry.time === bar.time) === index && seen.has(bar.time);
  });

  return unique
    .sort((a: { time: string; open: number; high: number; low: number; close: number; volume: number }, b: { time: string; open: number; high: number; low: number; close: number; volume: number }) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .filter((bar: { time: string; open: number; high: number; low: number; close: number; volume: number }) => bar.close > 0 && bar.high > 0 && bar.low > 0 && bar.open > 0 && Number.isFinite(bar.volume));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = (searchParams.get("ticker") ?? "HPG").trim().toUpperCase() || "HPG";
    const limit = Math.max(30, Math.min(500, Number.parseInt(searchParams.get("limit") ?? "120", 10) || 120));

    const now = Math.floor(Date.now() / 1000);
    const from = now - 365 * 24 * 60 * 60;
    const url = `${TCBS_HISTORY_URL}?ticker=${encodeURIComponent(ticker)}&type=stock&resolution=D&from=${from}&to=${now}`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.tcbs.com.vn/",
      },
      next: { revalidate: 60 },
    });

    let bars: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> = [];

    if (res.ok) {
      const json = await res.json().catch(() => null);
      const rawBars = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      bars = normalizeTcbsBars(rawBars).slice(-limit);
    }

    if (bars.length === 0) {
      return NextResponse.json({
        success: false,
        ticker,
        bars: [],
        currentPrice: 0,
        message: "TCBS returned no valid bars.",
      }, { status: 200 });
    }

    const currentPrice = bars[bars.length - 1]?.close || 0;

    return NextResponse.json({
      success: true,
      ticker,
      bars,
      currentPrice,
    });
  } catch (error) {
    console.error("[TCBS History Proxy Error]:", error);
    return NextResponse.json({
      success: false,
      ticker: "HPG",
      bars: [],
      currentPrice: 0,
      message: "Failed to resolve TCBS market history.",
    }, { status: 200 });
  }
}
