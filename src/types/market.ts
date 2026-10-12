export type MarketSide = "buy" | "sell";
export type OrderSide = "bid" | "ask";
export type StockCategory =
  | "Tất Cả"
  | "HOSE"
  | "HNX"
  | "UPCOM"
  | "VN30";

export interface StockDefinition {
  symbol: string;
  name: string;
  sector: string;
  category: Exclude<StockCategory, "Tất Cả">;
  price: number;
  referencePrice: number;
  lotSize: number;
  color: string;
}

export interface TickerData {
  symbol: string;
  name: string;
  price: number;
  referencePrice: number;
  floorPrice: number;
  ceilingPrice: number;
  change: number;
  changePct: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  lastUpdated?: number;
  isUp?: boolean;
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePct: number;
}

export interface CandleData {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  volume: number;
  side: OrderSide;
  depth: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: MarketSide;
  qty: number;
  price: number;
  totalValue: number;
  fee: number;
  tax: number;
  createdAt: number;
  pnl?: number;
}

export interface PositionRecord {
  id: string;
  symbol: string;
  side: MarketSide;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  createdAt: number;
  status: "open" | "closed";
}

export interface TradeProposalCard {
  action: "MUA" | "BÁN";
  ticker: string;
  quantity: number;
  targetPrice: number;
  stopLoss: number;
  takeProfit: number;
  totalValue: number;
  rationale: string;
  status: "ĐỀ XUẤT" | "ĐÃ KHỚP LỆNH";
}

export interface CouncilAgentResponse {
  name: string;
  color: string;
  thesis: string;
  confidence: number;
}

export interface CouncilApiResponse {
  mode: "general" | "stock";
  source: string;
  summary: string;
  content: string;
  bulletPoints?: string[];
  codeExample?: string;
  agents?: CouncilAgentResponse[];
  tradeProposal?: TradeProposalCard;
}

export interface AutopsyDimension {
  title: string;
  verdict: string;
  detail: string;
}

export interface AutopsyReport {
  headline: string;
  dimensions: AutopsyDimension[];
  checklist: string[];
}

export const STARTING_CAPITAL_VND = 500_000_000;
export const HOSE_TICK_RULES = {
  under10k: 10,
  under50k: 50,
  above50k: 100,
} as const;

export function formatMoneyVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value)) + " ₫";
}

export function getTickStep(price: number): number {
  if (price < 10_000) return HOSE_TICK_RULES.under10k;
  if (price < 50_000) return HOSE_TICK_RULES.under50k;
  return HOSE_TICK_RULES.above50k;
}

export function snapToTick(price: number): number {
  const step = getTickStep(price);
  return Math.round(price / step) * step;
}

export function normalizeLot(quantity: number): number {
  return Math.round(quantity / 100) * 100;
}
