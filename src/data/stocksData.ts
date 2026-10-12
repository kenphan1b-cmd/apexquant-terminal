import type { StockCategory, StockDefinition } from "@/src/types/market";

export const STOCKS: StockDefinition[] = [
  { symbol: "FPT", name: "FPT", sector: "Công nghệ", category: "VN30", price: 134500, referencePrice: 134500, lotSize: 100, color: "#D946EF" },
  { symbol: "HPG", name: "HPG", sector: "Thép", category: "VN30", price: 27100, referencePrice: 27100, lotSize: 100, color: "#10B981" },
  { symbol: "VHM", name: "Vinhomes", sector: "Bất động sản", category: "VN30", price: 46500, referencePrice: 46500, lotSize: 100, color: "#00F59B" },
  { symbol: "VIC", name: "Vingroup", sector: "Bất động sản", category: "VN30", price: 42000, referencePrice: 42000, lotSize: 100, color: "#00F59B" },
  { symbol: "VNM", name: "VNM", sector: "Thực phẩm", category: "VN30", price: 69800, referencePrice: 69800, lotSize: 100, color: "#06B6D4" },
  { symbol: "MWG", name: "MWG", sector: "Bán lẻ", category: "VN30", price: 43600, referencePrice: 43600, lotSize: 100, color: "#10B981" },
  { symbol: "SSI", name: "SSI", sector: "Chứng khoán", category: "VN30", price: 34100, referencePrice: 34100, lotSize: 100, color: "#FF3B69" },
  { symbol: "TCB", name: "Techcombank", sector: "Ngân hàng", category: "VN30", price: 21800, referencePrice: 21800, lotSize: 100, color: "#FF00FF" },
  { symbol: "MBB", name: "MB Bank", sector: "Ngân hàng", category: "VN30", price: 20500, referencePrice: 20500, lotSize: 100, color: "#FF00FF" },
  { symbol: "VCB", name: "Vietcombank", sector: "Ngân hàng", category: "HOSE", price: 86400, referencePrice: 86400, lotSize: 100, color: "#FF00FF" },
  { symbol: "BID", name: "BIDV", sector: "Ngân hàng", category: "HOSE", price: 32500, referencePrice: 32500, lotSize: 100, color: "#FF00FF" },
  { symbol: "ACB", name: "ACB", sector: "Ngân hàng", category: "HOSE", price: 22100, referencePrice: 22100, lotSize: 100, color: "#FF00FF" },
  { symbol: "VPB", name: "VPBank", sector: "Ngân hàng", category: "HOSE", price: 19350, referencePrice: 19350, lotSize: 100, color: "#FF00FF" },
  { symbol: "CTG", name: "CTG", sector: "Ngân hàng", category: "HOSE", price: 27300, referencePrice: 27300, lotSize: 100, color: "#FF00FF" },
  { symbol: "VRE", name: "Vincom Retail", sector: "Bất động sản", category: "HOSE", price: 29200, referencePrice: 29200, lotSize: 100, color: "#00F59B" },
  { symbol: "MSN", name: "MSN", sector: "Chất liệu", category: "HOSE", price: 54500, referencePrice: 54500, lotSize: 100, color: "#06B6D4" },
  { symbol: "SAB", name: "SABeco", sector: "Thương hiệu", category: "HOSE", price: 28700, referencePrice: 28700, lotSize: 100, color: "#10B981" },
  { symbol: "VND", name: "VND", sector: "Bán lẻ", category: "HOSE", price: 26500, referencePrice: 26500, lotSize: 100, color: "#10B981" },
  { symbol: "SHS", name: "Saigon HN Securities", sector: "Chứng khoán", category: "HNX", price: 16900, referencePrice: 16900, lotSize: 100, color: "#38bdf8" },
  { symbol: "PVS", name: "Petro Vietnam", sector: "Dầu khí", category: "HNX", price: 27700, referencePrice: 27700, lotSize: 100, color: "#38bdf8" },
  { symbol: "IDC", name: "Idico", sector: "Cơ sở hạ tầng", category: "HNX", price: 24100, referencePrice: 24100, lotSize: 100, color: "#38bdf8" },
  { symbol: "CEO", name: "CEO", sector: "Bất động sản", category: "HNX", price: 19300, referencePrice: 19300, lotSize: 100, color: "#38bdf8" },
  { symbol: "MBS", name: "MBS", sector: "Ngân hàng", category: "HNX", price: 18150, referencePrice: 18150, lotSize: 100, color: "#38bdf8" },
  { symbol: "BSR", name: "BSR", sector: "Cơ khí", category: "UPCOM", price: 16700, referencePrice: 16700, lotSize: 100, color: "#f97316" },
  { symbol: "ACV", name: "ACV", sector: "Hàng không", category: "UPCOM", price: 18300, referencePrice: 18300, lotSize: 100, color: "#f97316" },
  { symbol: "MCH", name: "MCH", sector: "Chế biến", category: "UPCOM", price: 15400, referencePrice: 15400, lotSize: 100, color: "#f97316" },
  { symbol: "VEA", name: "VEA", sector: "Dịch vụ vận tải", category: "UPCOM", price: 21400, referencePrice: 21400, lotSize: 100, color: "#f97316" },
  { symbol: "VGI", name: "VGI", sector: "Truyền thông", category: "UPCOM", price: 20600, referencePrice: 20600, lotSize: 100, color: "#f97316" },
];

export const CATEGORY_OPTIONS: StockCategory[] = ["Tất Cả", "HOSE", "HNX", "UPCOM", "VN30"];

export const STOCKS_BY_SYMBOL = Object.fromEntries(
  STOCKS.map((stock) => [stock.symbol, stock])
) as Record<string, (typeof STOCKS)[number]>;
