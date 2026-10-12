"use client";
// hooks/useMarketFeed.ts
// Centralized state hook simulating tick-by-tick real-time price feed and order matching engine

import { useState, useEffect, useRef, useCallback } from "react";

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePct: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  volume: number;
  side: "bid" | "ask";
  depth?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  volume: number;
  side: "buy" | "sell";
  time: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
}

const VN30_STOCKS: Record<string, number> = {
  FPT: 130500,
  HPG: 27200,
  VCB: 86400,
  SSI: 32800,
  MWG: 46500,
  TCB: 21900,
  VHM: 44200,
  VIC: 38700,
  VNM: 72100,
  MSN: 55300,
};

function generateCandles(basePrice: number, count: number): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice * 0.92;
  const now = Math.floor(Date.now() / 1000);

  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.48) * price * 0.012;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;
    const volume = Math.floor(100000 + Math.random() * 900000);

    candles.push({
      time: now - i * 300,
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    });
    price = close;
  }
  return candles;
}

function generateOrderBook(midPrice: number): OrderBookEntry[] {
  const entries: OrderBookEntry[] = [];
  let totalBid = 0;
  let totalAsk = 0;

  for (let i = 1; i <= 10; i++) {
    const bidVol = Math.floor(50000 + Math.random() * 500000);
    const askVol = Math.floor(50000 + Math.random() * 500000);
    totalBid += bidVol;
    totalAsk += askVol;

    entries.push({
      price: Math.round(midPrice - i * 100),
      volume: bidVol,
      side: "bid",
      depth: totalBid,
    });
    entries.push({
      price: Math.round(midPrice + i * 100),
      volume: askVol,
      side: "ask",
      depth: totalAsk,
    });
  }
  return entries;
}

export function useMarketFeed() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("FPT");
  const [isInitialized, setIsInitialized] = useState(false);

  // Deterministic initial tickers — no Math.random() during SSR/prerender
  const [tickers, setTickers] = useState<Record<string, TickerData>>(() => {
    const init: Record<string, TickerData> = {};
    Object.entries(VN30_STOCKS).forEach(([sym, basePrice]) => {
      init[sym] = {
        symbol: sym,
        price: basePrice,
        change: 0,
        changePct: 0,
        volume: 1000000,
        high: Math.round(basePrice * 1.015),
        low: Math.round(basePrice * 0.985),
        open: basePrice,
      };
    });
    return init;
  });

  const [indices, setIndices] = useState<IndexData[]>([
    { name: "VN-Index", value: 1289.45, change: 8.32, changePct: 0.65 },
    { name: "HNX-Index", value: 236.87, change: -1.24, changePct: -0.52 },
    { name: "VN30", value: 1342.18, change: 12.05, changePct: 0.9 },
  ]);

  const [candles, setCandles] = useState<CandleData[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookEntry[]>([]);

  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [paperBalance, setPaperBalance] = useState<number>(100000);
  const [isConnected] = useState(true);

  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  // One-time client-side initialization — seeds random prices & candles after hydration
  useEffect(() => {
    if (isInitialized) return;
    setTickers(() => {
      const init: Record<string, TickerData> = {};
      Object.entries(VN30_STOCKS).forEach(([sym, basePrice]) => {
        const change = (Math.random() - 0.48) * basePrice * 0.02;
        init[sym] = {
          symbol: sym,
          price: Math.round(basePrice + change),
          change: Math.round(change),
          changePct: parseFloat(((change / basePrice) * 100).toFixed(2)),
          volume: Math.floor(500000 + Math.random() * 2000000),
          high: Math.round(basePrice * 1.015),
          low: Math.round(basePrice * 0.985),
          open: basePrice,
        };
      });
      return init;
    });
    setCandles(generateCandles(VN30_STOCKS["FPT"], 120));
    setOrderBook(generateOrderBook(VN30_STOCKS["FPT"]));
    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tickers tick-by-tick
  useEffect(() => {
    const id = setInterval(() => {
      setTickers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((sym) => {
          const t = next[sym];
          const drift = (Math.random() - 0.499) * t.price * 0.0008;
          const newPrice = Math.max(
            t.low - 100,
            Math.min(t.high + 100, Math.round(t.price + drift))
          );
          const change = newPrice - t.open;
          next[sym] = {
            ...t,
            price: newPrice,
            change: Math.round(change),
            changePct: parseFloat(((change / t.open) * 100).toFixed(2)),
            volume: t.volume + Math.floor(Math.random() * 5000),
            high: Math.max(t.high, newPrice),
            low: Math.min(t.low, newPrice),
          };
        });
        return next;
      });
    }, 800);
    intervalsRef.current.push(id);
    return () => clearInterval(id);
  }, []);

  // Update index prices
  useEffect(() => {
    const id = setInterval(() => {
      setIndices((prev) =>
        prev.map((idx) => {
          const drift = (Math.random() - 0.499) * idx.value * 0.0005;
          const newValue = parseFloat((idx.value + drift).toFixed(2));
          const change = parseFloat((newValue - (idx.value - idx.change)).toFixed(2));
          return {
            ...idx,
            value: newValue,
            change,
            changePct: parseFloat(((change / (idx.value - idx.change)) * 100).toFixed(2)),
          };
        })
      );
    }, 1200);
    intervalsRef.current.push(id);
    return () => clearInterval(id);
  }, []);

  // Add candles and update order book
  useEffect(() => {
    const id = setInterval(() => {
      const price = tickers[selectedSymbol]?.price ?? VN30_STOCKS[selectedSymbol];
      setCandles((prev) => {
        if (prev.length === 0) return prev; // not yet initialized
        const last = prev[prev.length - 1];
        const now = Math.floor(Date.now() / 1000);
        if (now - last.time >= 300) {
          return [
            ...prev.slice(-200),
            {
              time: now,
              open: last.close,
              high: Math.max(last.close, price),
              low: Math.min(last.close, price),
              close: price,
              volume: Math.floor(50000 + Math.random() * 200000),
            },
          ];
        }
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          close: price,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          volume: last.volume + Math.floor(Math.random() * 10000),
        };
        return updated;
      });

      setOrderBook(generateOrderBook(price));

      // Emit a random trade
      setRecentTrades((prev) => {
        const trade: Trade = {
          id: Math.random().toString(36).slice(2),
          symbol: selectedSymbol,
          price,
          volume: Math.floor(1000 + Math.random() * 50000),
          side: Math.random() > 0.5 ? "buy" : "sell",
          time: Date.now(),
        };
        return [trade, ...prev.slice(0, 29)];
      });
    }, 1500);
    intervalsRef.current.push(id);
    return () => clearInterval(id);
  }, [selectedSymbol, tickers]);

  // Update unrealized PnL for open positions
  useEffect(() => {
    const id = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => {
          const currentPrice = tickers[pos.symbol]?.price ?? pos.currentPrice;
          const pnlPerShare =
            pos.side === "buy"
              ? currentPrice - pos.entryPrice
              : pos.entryPrice - currentPrice;
          const unrealizedPnL = parseFloat(
            ((pnlPerShare / pos.entryPrice) * pos.qty * pos.entryPrice * 0.0001).toFixed(2)
          );
          return {
            ...pos,
            currentPrice,
            unrealizedPnL,
            unrealizedPnLPct: parseFloat(
              ((pnlPerShare / pos.entryPrice) * 100).toFixed(2)
            ),
          };
        })
      );
    }, 1000);
    intervalsRef.current.push(id);
    return () => clearInterval(id);
  }, [tickers]);

  const selectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setCandles(generateCandles(VN30_STOCKS[symbol] ?? 50000, 120));
  }, []);

  const placeOrder = useCallback(
    (
      symbol: string,
      side: "buy" | "sell",
      qty: number,
      price: number,
      _type: "limit" | "market"
    ) => {
      const cost = qty * price * 0.0001; // scaled down for USD paper account
      if (side === "buy" && cost > paperBalance) return false;

      const newPosition: Position = {
        id: Math.random().toString(36).slice(2),
        symbol,
        side,
        qty,
        entryPrice: price,
        currentPrice: price,
        unrealizedPnL: 0,
        unrealizedPnLPct: 0,
      };

      setPositions((prev) => [...prev, newPosition]);
      if (side === "buy") {
        setPaperBalance((b) => parseFloat((b - cost).toFixed(2)));
      }
      return true;
    },
    [paperBalance]
  );

  const closePosition = useCallback((posId: string) => {
    setPositions((prev) => {
      const pos = prev.find((p) => p.id === posId);
      if (pos) {
        const proceeds = pos.qty * pos.currentPrice * 0.0001;
        setPaperBalance((b) => parseFloat((b + proceeds + pos.unrealizedPnL).toFixed(2)));
      }
      return prev.filter((p) => p.id !== posId);
    });
  }, []);

  return {
    selectedSymbol,
    selectSymbol,
    tickers,
    indices,
    candles,
    orderBook,
    recentTrades,
    positions,
    paperBalance,
    isConnected,
    placeOrder,
    closePosition,
  };
}
