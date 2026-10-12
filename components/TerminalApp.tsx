"use client";

import { Suspense, useState } from "react";
import NextDynamic from "next/dynamic";
import { useMarketFeed } from "@/src/hooks/useMarketFeed";
import type { PositionRecord, TradeProposalCard } from "@/src/types/market";

const Header = NextDynamic(() => import("@/src/components/terminal/Header"), { ssr: false });
const Watchlist = NextDynamic(() => import("@/src/components/terminal/Watchlist"), { ssr: false });
const TradingChart = NextDynamic(() => import("@/src/components/terminal/TradingChart"), { ssr: false });
const OrderBook = NextDynamic(() => import("@/src/components/terminal/OrderBook"), { ssr: false });
const OrderEntry = NextDynamic(() => import("@/src/components/terminal/OrderEntry"), { ssr: false });
const PositionsTable = NextDynamic(() => import("@/src/components/terminal/PositionsTable"), { ssr: false });
const TradeAutopsyModal = NextDynamic(() => import("@/src/components/terminal/TradeAutopsyModal"), { ssr: false });
const AICopilotChat = NextDynamic(() => import("@/src/components/terminal/AICopilotChat"), { ssr: false });

function LoadingCell() {
  return (
    <div className="flex h-full items-center justify-center bg-[#0c0e14]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
    </div>
  );
}

export default function TerminalApp() {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [autopsyTarget, setAutopsyTarget] = useState<PositionRecord | null>(null);
  const [mobileView, setMobileView] = useState<"watchlist" | "chart" | "orders">("chart");
  const market = useMarketFeed();

  const selectedTicker = market.tickers[market.selectedSymbol];
  const latestCandle = market.candles[market.candles.length - 1];
  const midPrice = selectedTicker?.price ?? 0;
  const marketData = {
    symbol: market.selectedSymbol,
    lastPrice: selectedTicker?.price ?? latestCandle?.close ?? 0,
    price: selectedTicker?.price ?? latestCandle?.close ?? 0,
    close: latestCandle?.close ?? selectedTicker?.price ?? 0,
    open: latestCandle?.open ?? selectedTicker?.open ?? 0,
    high: latestCandle?.high ?? selectedTicker?.high ?? 0,
    low: latestCandle?.low ?? selectedTicker?.low ?? 0,
    volume: latestCandle?.volume ?? selectedTicker?.volume ?? 0,
    referencePrice: selectedTicker?.referencePrice ?? 0,
    change: selectedTicker?.change ?? 0,
    changePct: selectedTicker?.changePct ?? 0,
    recentCandles: market.candles.slice(-40),
    view: "TradingChart",
  };

  const handleApproveTrade = (proposal: TradeProposalCard) => {
    const result = market.approveTradeProposal(proposal);
    if (result.ok) {
      setCopilotOpen(false);
    }
  };

  const mobileTabs: Array<{ id: "watchlist" | "chart" | "orders"; label: string }> = [
    { id: "watchlist", label: "Watchlist" },
    { id: "chart", label: "Biểu đồ" },
    { id: "orders", label: "Sổ lệnh" },
  ];

  return (
    <div className="flex h-screen flex-col overflow-x-hidden bg-[#080a0f] text-white">
      <Suspense fallback={<div className="h-12 border-b border-white/10 bg-[#080a0f]" />}>
        <Header
          indices={market.indices}
          cashBalance={market.cashBalance}
          isConnected={market.isConnected}
          onOpenCopilot={() => setCopilotOpen(true)}
          onResetCapital={market.resetCapital}
        />
      </Suspense>

      <div className="border-b border-white/10 bg-[#0b0d12] px-2 py-2 lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          {mobileTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileView(tab.id)}
              className={`rounded-xl border px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${mobileView === tab.id ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/5 text-slate-400"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[220px_1fr_220px_260px] lg:grid-rows-[1fr_200px] lg:overflow-hidden">
        <div className="row-span-2 overflow-hidden border-r border-white/10">
          <Suspense fallback={<LoadingCell />}>
            <Watchlist tickers={market.tickers} selectedSymbol={market.selectedSymbol} onSelect={market.selectSymbol} priceFlash={market.priceFlash} />
          </Suspense>
        </div>

        <div className="overflow-hidden border-r border-b border-white/10">
          <Suspense fallback={<LoadingCell />}>
            {selectedTicker && <TradingChart symbol={market.selectedSymbol} ticker={selectedTicker} candles={market.candles} flashDirection={market.priceFlash[market.selectedSymbol] ?? null} />}
          </Suspense>
        </div>

        <div className="overflow-hidden border-r border-b border-white/10">
          <Suspense fallback={<LoadingCell />}>
            <OrderBook orderBook={market.orderBook} recentTrades={market.recentTrades} midPrice={midPrice} />
          </Suspense>
        </div>

        <div className="relative row-span-2 overflow-hidden">
          <Suspense fallback={<LoadingCell />}>
            {selectedTicker && (
              <OrderEntry
                symbol={market.selectedSymbol}
                ticker={selectedTicker}
                cashBalance={market.cashBalance}
                onPlaceOrder={(symbol, side, qty, price) => market.placeOrder(symbol, side, qty, price)}
              />
            )}
          </Suspense>
        </div>

        <div className="col-span-2 overflow-hidden border-t border-white/10">
          <Suspense fallback={<LoadingCell />}>
            <PositionsTable
              positions={market.positions}
              onClose={market.closePosition}
              onOpenAutopsy={(position) => setAutopsyTarget(position)}
            />
          </Suspense>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
        {mobileView === "watchlist" && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <Suspense fallback={<LoadingCell />}>
              <Watchlist tickers={market.tickers} selectedSymbol={market.selectedSymbol} onSelect={market.selectSymbol} priceFlash={market.priceFlash} />
            </Suspense>
          </div>
        )}

        {mobileView === "chart" && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <Suspense fallback={<LoadingCell />}>
              {selectedTicker && <TradingChart symbol={market.selectedSymbol} ticker={selectedTicker} candles={market.candles} flashDirection={market.priceFlash[market.selectedSymbol] ?? null} />}
            </Suspense>
          </div>
        )}

        {mobileView === "orders" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-w-0 border-b border-white/10">
              <Suspense fallback={<LoadingCell />}>
                <OrderBook orderBook={market.orderBook} recentTrades={market.recentTrades} midPrice={midPrice} />
              </Suspense>
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <Suspense fallback={<LoadingCell />}>
                {selectedTicker && (
                  <OrderEntry
                    symbol={market.selectedSymbol}
                    ticker={selectedTicker}
                    cashBalance={market.cashBalance}
                    onPlaceOrder={(symbol, side, qty, price) => market.placeOrder(symbol, side, qty, price)}
                  />
                )}
              </Suspense>
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden">
        <Suspense fallback={<LoadingCell />}>
          <PositionsTable
            positions={market.positions}
            onClose={market.closePosition}
            onOpenAutopsy={(position) => setAutopsyTarget(position)}
          />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        {copilotOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setCopilotOpen(false)}>
            <div className="absolute right-4 top-20 h-[calc(100vh-110px)] w-[min(540px,92vw)]" onClick={(event) => event.stopPropagation()}>
              <AICopilotChat
                marketData={marketData}
                activeTicker={market.selectedSymbol}
                currentPrice={marketData.lastPrice as number}
                onTradeProposal={handleApproveTrade}
                onApproveTrade={handleApproveTrade}
              />
            </div>
          </div>
        )}
      </Suspense>

      <TradeAutopsyModal
        isOpen={Boolean(autopsyTarget)}
        position={autopsyTarget}
        onClose={() => setAutopsyTarget(null)}
      />
    </div>
  );
}
