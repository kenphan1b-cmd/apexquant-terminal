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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#080a0f] text-white">
      <Suspense fallback={<div className="h-12 border-b border-white/10 bg-[#080a0f]" />}>
        <Header
          indices={market.indices}
          cashBalance={market.cashBalance}
          isConnected={market.isConnected}
          onOpenCopilot={() => setCopilotOpen(true)}
          onResetCapital={market.resetCapital}
        />
      </Suspense>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_220px_260px] grid-rows-[1fr_200px] overflow-hidden">
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
