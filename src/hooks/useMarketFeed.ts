"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STOCKS, STOCKS_BY_SYMBOL } from "@/src/data/stocksData";
import {
  STARTING_CAPITAL_VND,
  type CandleData,
  type IndexData,
  type OrderBookEntry,
  type PositionRecord,
  type TickerData,
  type TradeRecord,
  formatMoneyVND,
  getTickStep,
  normalizeLot,
  snapToTick,
} from "@/src/types/market";

const HOSE_FLOOR_RATIO = 0.93;
const HOSE_CEILING_RATIO = 1.07;

function safeRound(value: number): number {
  return Math.round(value * 100) / 100;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createTickerSnapshot(stock: (typeof STOCKS)[number], latestCandle?: CandleData | null): TickerData {
  const reference = stock.referencePrice;
  const close = latestCandle?.close ?? stock.price;
  const previousClose = latestCandle ? (latestCandle.open ?? close) : close;
  const change = close - previousClose;
  const changePct = previousClose ? (change / previousClose) * 100 : 0;
  const high = latestCandle ? Math.max(latestCandle.high, close) : Math.max(stock.price, Math.round(reference * 1.015));
  const low = latestCandle ? Math.min(latestCandle.low, close) : Math.min(stock.price, Math.round(reference * 0.985));

  return {
    symbol: stock.symbol,
    name: stock.name,
    price: close,
    referencePrice: reference,
    floorPrice: Math.round(reference * HOSE_FLOOR_RATIO),
    ceilingPrice: Math.round(reference * HOSE_CEILING_RATIO),
    change: safeRound(change),
    changePct: safeRound(changePct),
    volume: latestCandle?.volume ?? 400000,
    high: safeRound(high),
    low: safeRound(low),
    open: latestCandle?.open ?? close,
  };
}

function buildOrderBook(midPrice: number): OrderBookEntry[] {
  const entries: OrderBookEntry[] = [];
  let cumulativeBid = 0;
  let cumulativeAsk = 0;

  for (let i = 1; i <= 5; i += 1) {
    const bidVolume = 18000 + i * 9000 + Math.round(midPrice / 12);
    const askVolume = 16000 + i * 8500 + Math.round(midPrice / 15);
    cumulativeBid += bidVolume;
    cumulativeAsk += askVolume;

    entries.push({
      price: Math.round(midPrice - i * getTickStep(midPrice)),
      volume: bidVolume,
      side: "bid",
      depth: cumulativeBid,
    });

    entries.push({
      price: Math.round(midPrice + i * getTickStep(midPrice)),
      volume: askVolume,
      side: "ask",
      depth: cumulativeAsk,
    });
  }

  return entries.sort((a, b) => {
    if (a.side === b.side) {
      return a.side === "bid" ? b.price - a.price : a.price - b.price;
    }
    return a.side === "bid" ? -1 : 1;
  });
}

function createInitialTickers(): Record<string, TickerData> {
  return Object.fromEntries(STOCKS.map((stock) => [stock.symbol, createTickerSnapshot(stock)]));
}

function normalizeHistoryPayload(payload: any, fallbackSymbol: string) {
  const fallbackStock = STOCKS_BY_SYMBOL[fallbackSymbol] ?? STOCKS[0];
  const rawBars = Array.isArray(payload?.bars)
    ? payload.bars
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  const normalizedCandles: CandleData[] = (rawBars as Array<Record<string, any>>)
    .map((entry: Record<string, any>): CandleData | null => {
      const timeValue = typeof entry.time === "string"
        ? entry.time.substring(0, 10)
        : typeof entry.date === "string"
          ? entry.date.substring(0, 10)
          : typeof entry.day === "string"
            ? entry.day.substring(0, 10)
            : "";

      if (!/^\d{4}-\d{2}-\d{2}$/.test(timeValue)) {
        return null;
      }

      const candle: CandleData = {
        time: timeValue,
        open: Number(entry.open ?? entry.o ?? 0),
        high: Number(entry.high ?? entry.h ?? 0),
        low: Number(entry.low ?? entry.l ?? 0),
        close: Number(entry.close ?? entry.c ?? 0),
        volume: Number(entry.volume ?? entry.v ?? 0),
      };

      if (!Number.isFinite(candle.close) || candle.close <= 0) {
        return null;
      }

      return candle;
    })
    .filter((entry: CandleData | null): entry is CandleData => Boolean(entry))
    .sort((a: CandleData, b: CandleData) => (String(a.time) > String(b.time) ? 1 : -1));

  const lastCandle = normalizedCandles[normalizedCandles.length - 1] ?? null;
  const ticker = payload?.ticker ?? createTickerSnapshot(fallbackStock, lastCandle);

  return {
    ticker: typeof ticker === "object" ? ticker : createTickerSnapshot(fallbackStock, lastCandle),
    candles: normalizedCandles,
    orderBook: Array.isArray(payload?.orderBook)
      ? payload.orderBook
      : buildOrderBook((typeof ticker === "object" ? ticker.price : fallbackStock.price) || fallbackStock.price),
    indices: Array.isArray(payload?.indices)
      ? payload.indices
      : [
          { name: "VN-Index", value: 1295.5, change: 12.4, changePct: 0.96 },
          { name: "HNX-Index", value: 234.46, change: -1.7, changePct: -0.72 },
          { name: "VN30", value: 1364.1, change: 18.9, changePct: 1.4 },
        ],
  };
}

export function useMarketFeed() {
  const [selectedSymbol, setSelectedSymbol] = useState("FPT");
  const [tickers, setTickers] = useState<Record<string, TickerData>>(() => createInitialTickers());
  const [indices, setIndices] = useState<IndexData[]>([
    { name: "VN-Index", value: 1295.5, change: 12.4, changePct: 0.96 },
    { name: "HNX-Index", value: 234.46, change: -1.7, changePct: -0.72 },
    { name: "VN30", value: 1364.1, change: 18.9, changePct: 1.4 },
  ]);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookEntry[]>(() => buildOrderBook(STOCKS_BY_SYMBOL["FPT"]?.price ?? 30000));
  const [recentTrades, setRecentTrades] = useState<TradeRecord[]>([]);
  const [positions, setPositions] = useState<PositionRecord[]>([]);
  const [cashBalance, setCashBalance] = useState(STARTING_CAPITAL_VND);
  const [toast, setToast] = useState<string | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [priceFlash, setPriceFlash] = useState<Record<string, "up" | "down">>({});
  const flashTimeoutsRef = useRef<Record<string, number>>({});

  const totalEquity = useMemo(
    () => cashBalance + positions.reduce((sum, position) => sum + position.unrealizedPnL, 0),
    [cashBalance, positions]
  );

  const clearToast = useCallback(() => {
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const triggerPriceFlash = useCallback((symbol: string, direction: "up" | "down") => {
    setPriceFlash((prev) => ({ ...prev, [symbol]: direction }));
    if (flashTimeoutsRef.current[symbol]) {
      window.clearTimeout(flashTimeoutsRef.current[symbol]);
    }
    flashTimeoutsRef.current[symbol] = window.setTimeout(() => {
      setPriceFlash((prev) => {
        const next = { ...prev };
        delete next[symbol];
        return next;
      });
    }, 500);
  }, []);

  const resetCapital = useCallback(() => {
    setPositions([]);
    setCashBalance(STARTING_CAPITAL_VND);
    setTradeHistory([]);
    setToast("✅ VỐN ĐÃ ĐƯỢC NẠP LẠI. Tiền mặt khả dụng: 500.000.000 ₫");
    clearToast();
  }, [clearToast]);

  const liquidateAccount = useCallback(() => {
    setPositions((prev) => {
      if (prev.length === 0) {
        setCashBalance(STARTING_CAPITAL_VND);
        return prev;
      }

      const liquidationTrades = prev.map((position) => ({
        id: `liquidation-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        symbol: position.symbol,
        side: "sell" as const,
        qty: position.qty,
        price: position.currentPrice,
        totalValue: position.currentPrice * position.qty,
        fee: 0,
        tax: 0,
        createdAt: Date.now(),
        pnl: position.unrealizedPnL,
      }));

      setTradeHistory((current) => [...liquidationTrades, ...current].slice(0, 40));
      setCashBalance(STARTING_CAPITAL_VND);
      setToast("⚠️ TÀI KHOẢN ĐÃ BỊ THANH LÝ! HỆ THỐNG ĐÃ HỒI PHỤC LẠI 10.000.000 ₫ ĐỂ BẠN TIẾP TỤC THỰC CHIẾN.");
      clearToast();
      return [];
    });
  }, [clearToast]);

  useEffect(() => {
    if (totalEquity <= 0) {
      liquidateAccount();
    }
  }, [liquidateAccount, totalEquity]);

  const refreshMarket = useCallback(async (symbol: string) => {
    const stock = STOCKS_BY_SYMBOL[symbol] ?? STOCKS[0];
    setCandles((prev) => prev.slice(-250));
    setOrderBook((prev) => (prev.length > 0 ? prev : buildOrderBook(stock.price)));

    try {
      const response = await fetch(`/api/market/history?ticker=${encodeURIComponent(symbol)}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Market history fetch failed with status ${response.status}`);
      }

      const json = await response.json();
      const bars = Array.isArray(json) ? json : (Array.isArray(json?.bars) ? json.bars : []);

      if (Array.isArray(bars) && bars.length > 0) {
        const validBars: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> = bars
          .map((entry: any) => ({
            time: typeof entry.time === "string" ? entry.time.substring(0, 10) : String(entry.date ?? entry.day ?? ""),
            open: Number(entry.open ?? entry.o ?? 0),
            high: Number(entry.high ?? entry.h ?? 0),
            low: Number(entry.low ?? entry.l ?? 0),
            close: Number(entry.close ?? entry.c ?? 0),
            volume: Number(entry.volume ?? entry.v ?? 0),
          }))
          .filter((entry: { time: string; open: number; high: number; low: number; close: number; volume: number }) => /^\d{4}-\d{2}-\d{2}$/.test(entry.time) && Number.isFinite(entry.close) && entry.close > 0)
          .sort((a, b) => String(a.time).localeCompare(String(b.time)));

        if (validBars.length > 0) {
          const latestBar = validBars[validBars.length - 1];
          const normalized = normalizeHistoryPayload({ ...json, bars: validBars }, symbol);
          const ticker = normalized.ticker ?? createTickerSnapshot(stock, latestBar);
          const latestPrice = Number(latestBar.close ?? ticker.price ?? stock.price);
          const reference = ticker.referencePrice || stock.referencePrice || latestPrice;
          const baseOpen = latestBar.open ?? ticker.open ?? latestPrice;
          const delta = latestPrice - baseOpen;
          const nextTicker: TickerData = {
            ...ticker,
            price: latestPrice,
            change: safeRound(delta),
            changePct: safeRound(baseOpen ? (delta / baseOpen) * 100 : 0),
            high: Math.max(ticker.high, latestPrice),
            low: Math.min(ticker.low, latestPrice),
            referencePrice: reference,
            floorPrice: Math.round(reference * HOSE_FLOOR_RATIO),
            ceilingPrice: Math.round(reference * HOSE_CEILING_RATIO),
          };

          setTickers((prev) => ({ ...prev, [symbol]: nextTicker }));
          setCandles(validBars);
          setOrderBook(buildOrderBook(latestPrice));
          setRecentTrades((prev) => prev.slice(0, 20));
          return;
        }
      }

      const fallbackTicker = createTickerSnapshot(stock, null);
      setTickers((prev) => ({ ...prev, [symbol]: fallbackTicker }));
      setCandles([]);
      setOrderBook(buildOrderBook(fallbackTicker.price));
      setRecentTrades((prev) => prev.slice(0, 20));
    } catch (error) {
      console.warn("Market history unavailable:", error);
      const fallbackTicker = createTickerSnapshot(stock, null);
      setTickers((prev) => ({ ...prev, [symbol]: fallbackTicker }));
      setCandles([]);
      setOrderBook(buildOrderBook(fallbackTicker.price));
    }
  }, []);

  useEffect(() => {
    void refreshMarket(selectedSymbol);
  }, [refreshMarket, selectedSymbol]);

  useEffect(() => {
    const indexInterval = window.setInterval(() => {
      setIndices((prev) => prev.map((index) => {
        const drift = randomBetween(-0.18, 0.18);
        const newValue = Number((index.value + drift).toFixed(2));
        const change = Number((newValue - index.value + index.change).toFixed(2));
        const nextPct = index.value !== 0 ? (change / index.value) * 100 : 0;
        return {
          ...index,
          value: newValue,
          change: Number(change.toFixed(2)),
          changePct: Number(nextPct.toFixed(2)),
        };
      }));
    }, 1200);

    return () => window.clearInterval(indexInterval);
  }, []);

  useEffect(() => {
    const watchlistInterval = window.setInterval(() => {
      setTickers((prev) => {
        const symbols = Object.keys(prev);
        const count = Math.random() > 0.6 ? 2 : 1;
        const selectedSymbols = [...symbols].sort(() => Math.random() - 0.5).slice(0, Math.min(count, symbols.length));
        const next = { ...prev };

        selectedSymbols.forEach((symbol) => {
          const current = next[symbol];
          if (!current) return;

          const movement = randomBetween(-0.008, 0.008);
          const nextPrice = Math.max(current.price * 0.8, Math.min(current.price * 1.2, current.price * (1 + movement)));
          const previousOpen = current.open || current.price;
          const delta = nextPrice - previousOpen;
          const pct = previousOpen ? (delta / previousOpen) * 100 : 0;

          next[symbol] = {
            ...current,
            price: Math.round(nextPrice),
            change: safeRound(delta),
            changePct: safeRound(pct),
            high: Math.max(current.high, Math.round(nextPrice)),
            low: Math.min(current.low, Math.round(nextPrice)),
            volume: current.volume + Math.floor(randomBetween(2000, 26000)),
          };

          triggerPriceFlash(symbol, nextPrice >= current.price ? "up" : "down");
        });

        return next;
      });
    }, randomBetween(3000, 5000));

    return () => window.clearInterval(watchlistInterval);
  }, [triggerPriceFlash]);

  useEffect(() => {
    const liveTickInterval = window.setInterval(() => {
      const stock = STOCKS_BY_SYMBOL[selectedSymbol] ?? STOCKS[0];
      let activePrice = tickers[selectedSymbol]?.price ?? stock.price;

      setTickers((prev) => {
        const current = prev[selectedSymbol] ?? createTickerSnapshot(stock);
        const drift = (Math.random() - 0.49) * 0.002;
        const nextPriceRaw = current.price * (1 + drift);
        const nextPrice = Math.round(nextPriceRaw);
        const previousOpen = current.open || current.price;
        const delta = nextPrice - previousOpen;
        const pct = previousOpen ? (delta / previousOpen) * 100 : 0;

        activePrice = nextPrice;
        triggerPriceFlash(selectedSymbol, nextPrice >= current.price ? "up" : "down");

        return {
          ...prev,
          [selectedSymbol]: {
            ...current,
            price: nextPrice,
            change: safeRound(delta),
            changePct: safeRound(pct),
            high: Math.max(current.high, nextPrice),
            low: Math.min(current.low, nextPrice),
            volume: current.volume + Math.floor(randomBetween(1000, 6000)),
          },
        };
      });

      setCandles((prev) => {
        const dayKey = new Date().toISOString().slice(0, 10);
        const last = prev[prev.length - 1] ?? null;

        const nextClose = Math.round(activePrice * (1 + (Math.random() - 0.49) * 0.0015));
        const nextBar: CandleData = last && last.time === dayKey
          ? {
              ...last,
              close: nextClose,
              high: Math.max(last.high, nextClose),
              low: Math.min(last.low, nextClose),
              volume: last.volume + Math.floor(randomBetween(1000, 15000)),
            }
          : {
              time: dayKey,
              open: activePrice,
              high: nextClose,
              low: nextClose,
              close: nextClose,
              volume: Math.floor(randomBetween(1000, 15000)),
            };

        const nextCandles = last && last.time === dayKey ? [...prev.slice(-199, -1), nextBar] : [...prev.slice(-199), nextBar];
        return nextCandles.sort((a, b) => String(a.time).localeCompare(String(b.time)));
      });

      setOrderBook(buildOrderBook(activePrice));
      setRecentTrades((prev) => {
        const nextTrade: TradeRecord = {
          id: `trade-${Date.now()}`,
          symbol: selectedSymbol,
          side: Math.random() > 0.5 ? "buy" : "sell",
          qty: Math.floor(randomBetween(100, 5000)),
          price: activePrice,
          totalValue: activePrice * Math.floor(randomBetween(100, 5000)),
          fee: 0,
          tax: 0,
          createdAt: Date.now(),
        };

        return [nextTrade, ...prev].slice(0, 12);
      });
    }, randomBetween(1500, 2500));

    return () => window.clearInterval(liveTickInterval);
  }, [selectedSymbol, tickers, triggerPriceFlash]);

  useEffect(() => {
    const pollingInterval = window.setInterval(() => {
      setTickers((prev) => {
        const stock = STOCKS_BY_SYMBOL[selectedSymbol] ?? STOCKS[0];
        const current = prev[selectedSymbol] ?? createTickerSnapshot(stock);
        const drift = (Math.random() - 0.48) * 0.006;
        const nextPrice = Math.max(100, Math.round(current.price * (1 + drift)));
        const previousOpen = current.open || current.price;
        const delta = nextPrice - previousOpen;
        const pct = previousOpen ? (delta / previousOpen) * 100 : 0;

        const nextTicker: TickerData = {
          ...current,
          price: nextPrice,
          change: safeRound(delta),
          changePct: safeRound(pct),
          high: Math.max(current.high, nextPrice),
          low: Math.min(current.low, nextPrice),
          volume: current.volume + Math.floor(randomBetween(1000, 7000)),
          lastUpdated: Date.now(),
          isUp: nextPrice >= current.price,
        };

        setOrderBook(buildOrderBook(nextPrice));
        triggerPriceFlash(selectedSymbol, nextPrice >= current.price ? "up" : "down");
        return { ...prev, [selectedSymbol]: nextTicker };
      });

      void refreshMarket(selectedSymbol);
    }, 5000);

    return () => window.clearInterval(pollingInterval);
  }, [refreshMarket, selectedSymbol, triggerPriceFlash]);

  useEffect(() => {
    setPositions((prev) =>
      prev.map((position) => {
        const currentPrice = tickers[position.symbol]?.price ?? position.currentPrice;
        const pnlPerShare = position.side === "buy" ? currentPrice - position.entryPrice : position.entryPrice - currentPrice;
        const unrealizedPnL = pnlPerShare * position.qty;
        return {
          ...position,
          currentPrice,
          unrealizedPnL: safeRound(unrealizedPnL),
          unrealizedPnLPct: safeRound((pnlPerShare / position.entryPrice) * 100),
        };
      })
    );
  }, [tickers]);

  const selectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    const stock = STOCKS_BY_SYMBOL[symbol];
    if (stock) {
      setOrderBook(buildOrderBook(stock.price));
    }
  }, []);

  const placeTradeOrder = useCallback(
    (symbol: string, side: "buy" | "sell", qty: number, price: number) => {
      const normalizedQty = normalizeLot(qty);
      if (normalizedQty <= 0 || normalizedQty % 100 !== 0) {
        return {
          ok: false,
          message: "Số lượng phải là bội số của 100 cổ phiếu.",
        };
      }

      const snappedPrice = snapToTick(price);
      const value = snappedPrice * normalizedQty;
      const fee = value * 0.0015;
      const tax = side === "sell" ? value * 0.001 : 0;
      const totalDebit = side === "buy" ? value + fee : value - fee - tax;

      if (side === "buy" && totalDebit > cashBalance) {
        return {
          ok: false,
          message: "Không đủ tiền mặt để đặt lệnh mua.",
        };
      }

      if (side === "sell") {
        const currentPosition = positions.find((entry) => entry.symbol === symbol && entry.side === "buy");
        if (!currentPosition || currentPosition.qty < normalizedQty) {
          return {
            ok: false,
            message: "Bạn không có đủ số lượng để bán.",
          };
        }
      }

      const newPosition: PositionRecord = {
        id: `position-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        symbol,
        side,
        qty: normalizedQty,
        entryPrice: snappedPrice,
        currentPrice: snappedPrice,
        unrealizedPnL: 0,
        unrealizedPnLPct: 0,
        createdAt: Date.now(),
        status: "open",
      };

      if (side === "buy") {
        setCashBalance((prev) => prev - totalDebit);
      } else {
        setCashBalance((prev) => prev + (value - fee - tax));
      }

      setTradeHistory((prev) => [
        {
          id: `trade-${Date.now()}`,
          symbol,
          side: side as TradeRecord["side"],
          qty: normalizedQty,
          price: snappedPrice,
          totalValue: value,
          fee,
          tax,
          createdAt: Date.now(),
        },
        ...prev,
      ].slice(0, 40));

      if (side === "buy") {
        setPositions((prev) => [...prev, newPosition]);
      } else {
        setPositions((prev) =>
          prev.map((entry) => {
            if (entry.symbol !== symbol || entry.side !== "buy") return entry;
            const remaining = entry.qty - normalizedQty;
            if (remaining <= 0) {
              return {
                ...entry,
                status: "closed",
                currentPrice: snappedPrice,
                unrealizedPnL: safeRound((snappedPrice - entry.entryPrice) * entry.qty),
              };
            }
            return {
              ...entry,
              qty: remaining,
              entryPrice: entry.entryPrice,
            };
          })
        );
      }

      return { ok: true, message: "Lệnh đã được ghi nhận." };
    },
    [cashBalance, positions]
  );

  const closePosition = useCallback((positionId: string) => {
    setPositions((prev) => {
      const position = prev.find((entry) => entry.id === positionId);
      if (!position) return prev;

      const currentPrice = tickers[position.symbol]?.price ?? position.currentPrice;
      const realizedPnl =
        position.side === "buy"
          ? (currentPrice - position.entryPrice) * position.qty
          : (position.entryPrice - currentPrice) * position.qty;
      const fee = currentPrice * position.qty * 0.0015;
      const tax = position.side === "buy" ? 0 : currentPrice * position.qty * 0.001;
      const proceeds = currentPrice * position.qty - fee - tax;

      setCashBalance((balance) => balance + proceeds + realizedPnl);
      setTradeHistory((history) => [
        {
          id: `close-${Date.now()}`,
          symbol: position.symbol,
          side: "sell" as const,
          qty: position.qty,
          price: currentPrice,
          totalValue: currentPrice * position.qty,
          fee,
          tax,
          createdAt: Date.now(),
          pnl: realizedPnl,
        },
        ...history,
      ].slice(0, 40));

      return prev.filter((entry) => entry.id !== positionId);
    });
  }, [tickers]);

  const approveTradeProposal = useCallback(
    (proposal?: {
      ticker?: string;
      symbol?: string;
      action?: string;
      side?: string;
      quantity?: number;
      targetPrice?: number;
      stopLoss?: number;
      takeProfit?: number;
      totalValue?: number;
    }) => {
      if (!proposal) {
        console.warn("Bỏ qua approveTradeProposal vì proposal không hợp lệ:", proposal);
        return { ok: false };
      }

      const rawAction = (proposal?.action || proposal?.side || "buy").toString().toLowerCase();
      const safeSide: "buy" | "sell" = rawAction.includes("sell") || rawAction.includes("bán") ? "sell" : "buy";
      const symbol = proposal?.ticker || proposal?.symbol || selectedSymbol || "FPT";
      const quantity = normalizeLot(Number(proposal.quantity ?? 0));
      const targetPrice = Number(proposal.targetPrice ?? 0);
      const fallbackTickerPrice = tickers[symbol]?.price ?? tickers[selectedSymbol]?.price ?? STOCKS_BY_SYMBOL[symbol]?.price ?? 0;
      const snappedPrice = snapToTick(targetPrice || Number(fallbackTickerPrice || 0));
      const value = snappedPrice * quantity;
      const fee = value * 0.0015;
      const finalCost = value + fee;

      if (!symbol || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(targetPrice) || targetPrice <= 0) {
        console.warn("Bỏ qua approveTradeProposal vì payload không đủ dữ liệu hợp lệ:", proposal);
        return { ok: false };
      }

      if (safeSide === "buy") {
        if (finalCost > cashBalance) {
          setToast("Tài khoản không đủ vốn để duyệt lệnh MUA đề xuất.");
          clearToast();
          return { ok: false };
        }
        setCashBalance((prev) => prev - finalCost);
        setPositions((prev) => [
          ...prev,
          {
            id: `proposal-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            symbol,
            side: "buy",
            qty: quantity,
            entryPrice: snappedPrice,
            currentPrice: snappedPrice,
            unrealizedPnL: 0,
            unrealizedPnLPct: 0,
            createdAt: Date.now(),
            status: "open",
          },
        ]);
      }

      setTradeHistory((prev) => [
        {
          id: `approved-${Date.now()}`,
          symbol,
          side: safeSide,
          qty: quantity,
          price: snappedPrice,
          totalValue: value,
          fee,
          tax: 0,
          createdAt: Date.now(),
        },
        ...prev,
      ].slice(0, 40));

      return { ok: true };
    },
    [cashBalance, clearToast, selectedSymbol, tickers]
  );

  return {
    selectedSymbol,
    selectSymbol,
    tickers,
    indices,
    candles,
    orderBook,
    recentTrades,
    positions,
    cashBalance,
    totalEquity,
    isConnected: true,
    toast,
    tradeHistory,
    placeOrder: placeTradeOrder,
    closePosition,
    approveTradeProposal,
    resetCapital,
    formatMoney: formatMoneyVND,
    getTickStep,
    normalizeLot,
    priceFlash,
  };
}
