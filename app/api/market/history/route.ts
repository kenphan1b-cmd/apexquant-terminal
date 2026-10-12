import { NextResponse } from "next/server";

function normalizePrice(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.round(numeric * 1000);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = (searchParams.get("ticker") ?? "FPT").trim().toUpperCase() || "FPT";
    const to = Math.floor(Date.now() / 1000);
    const from = to - 365 * 24 * 60 * 60;
    const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}&resolution=1D`;

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          isRealData: false,
          ticker,
          bars: [],
          currentPrice: 0,
          message: `DNSE returned status ${response.status} for ${ticker}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => null);
    const times = Array.isArray(data?.t) ? data.t : [];
    const opens = Array.isArray(data?.o) ? data.o : [];
    const highs = Array.isArray(data?.h) ? data.h : [];
    const lows = Array.isArray(data?.l) ? data.l : [];
    const closes = Array.isArray(data?.c) ? data.c : [];
    const volumes = Array.isArray(data?.v) ? data.v : [];

    const bars: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> = times
      .map((timestamp: number, index: number): { time: string; open: number; high: number; low: number; close: number; volume: number } | null => {
        const unixTime = Number(timestamp);
        if (!Number.isFinite(unixTime) || unixTime <= 0) {
          return null;
        }

        const date = new Date(unixTime * 1000);
        const time = date.toISOString().slice(0, 10);
        const open = normalizePrice(opens[index]);
        const high = normalizePrice(highs[index]);
        const low = normalizePrice(lows[index]);
        const close = normalizePrice(closes[index]);
        const volume = Number(volumes[index] ?? 0);

        if (!time || !/^\d{4}-\d{2}-\d{2}$/.test(time) || close <= 0 || high <= 0 || low <= 0 || open <= 0) {
          return null;
        }

        return {
          time,
          open,
          high: Math.max(high, open, close),
          low: Math.min(low, open, close),
          close,
          volume: Number.isFinite(volume) ? volume : 0,
        };
      })
      .filter((entry: { time: string; open: number; high: number; low: number; close: number; volume: number } | null): entry is { time: string; open: number; high: number; low: number; close: number; volume: number } => entry !== null)
      .sort((a: { time: string; open: number; high: number; low: number; close: number; volume: number }, b: { time: string; open: number; high: number; low: number; close: number; volume: number }) => (a.time > b.time ? 1 : -1));

    if (bars.length === 0) {
      return NextResponse.json(
        {
          success: false,
          isRealData: false,
          ticker,
          bars: [],
          currentPrice: 0,
          message: `DNSE returned no valid daily candles for ${ticker}`,
        },
        { status: 204 }
      );
    }

    return NextResponse.json({
      success: true,
      isRealData: true,
      ticker,
      bars,
      currentPrice: bars[bars.length - 1]?.close ?? 0,
    });
  } catch (error) {
    console.error("[DNSE History Proxy Error]:", error);
    return NextResponse.json(
      {
        success: false,
        isRealData: false,
        ticker: "FPT",
        bars: [],
        currentPrice: 0,
        message: "Unable to fetch DNSE market history.",
      },
      { status: 500 }
    );
  }
}
