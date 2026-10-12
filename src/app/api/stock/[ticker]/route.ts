import { NextResponse } from "next/server";
import { STOCKS_BY_SYMBOL } from "@/src/data/stocksData";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();
  const stock = STOCKS_BY_SYMBOL[ticker];

  if (!stock) {
    return NextResponse.json({ error: "Ticker không tồn tại." }, { status: 404 });
  }

  return NextResponse.json({
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    category: stock.category,
    price: stock.price,
    referencePrice: stock.referencePrice,
    floorPrice: Math.round(stock.referencePrice * 0.93),
    ceilingPrice: Math.round(stock.referencePrice * 1.07),
  });
}
