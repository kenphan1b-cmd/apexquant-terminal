import { NextResponse } from "next/server";

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function pickNestedValue(source: unknown, keys: string[]): number | null {
  if (!source || typeof source !== "object") return null;

  const value = Object.entries(source as Record<string, unknown>).find(([key]) =>
    keys.includes(key.toLowerCase()) || keys.includes(String(key).toLowerCase())
  )?.[1];

  if (value !== undefined && value !== null) {
    const numeric = asNumber(value);
    if (numeric !== null) return numeric;
  }

  for (const entry of Object.values(source as Record<string, unknown>)) {
    const nested = pickNestedValue(entry, keys);
    if (nested !== null) return nested;
  }

  return null;
}

function normalizeTicker(value: string | undefined | null): string {
  const match = String(value ?? "FPT").trim().toUpperCase();
  return /^[A-Z]{2,5}$/.test(match) ? match : "FPT";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = normalizeTicker(searchParams.get("ticker"));

    const response = await fetch(`https://apipubanalytics.tcbs.com.vn/e-analytics/v1/ticker/${encodeURIComponent(ticker)}/overview`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          ticker,
          data: {
            ticker,
            pe: null,
            pb: null,
            roe: null,
            marketCap: null,
            foreignNetBuy: null,
            week52High: null,
            week52Low: null,
          },
          message: `TCBS Analytics returned ${response.status}`,
        },
        { status: 200 }
      );
    }

    const payload = await response.json().catch(() => null);
    const root = payload && typeof payload === "object" ? payload : {};
    const source = (root as Record<string, unknown>).data && typeof (root as Record<string, unknown>).data === "object"
      ? ((root as Record<string, unknown>).data as Record<string, unknown>)
      : root;

    const pe = pickNestedValue(source, ["pe", "pe_ratio", "price_to_earnings"]);
    const pb = pickNestedValue(source, ["pb", "pb_ratio", "price_to_book"]);
    const roe = pickNestedValue(source, ["roe", "return_on_equity"]);
    const marketCap = pickNestedValue(source, ["marketcap", "market_cap", "marketcapvnd", "marketcapbillions"]);
    const foreignNetBuy = pickNestedValue(source, ["foreignnetbuy", "foreign_net_buy", "netforeignbuy", "foreign_buy_net"]);
    const week52High = pickNestedValue(source, ["pricehighest52w", "highest52w", "week52high", "price_highest_52w"]);
    const week52Low = pickNestedValue(source, ["pricelowest52w", "lowest52w", "week52low", "price_lowest_52w"]);

    return NextResponse.json({
      success: true,
      data: {
        ticker,
        pe: pe ?? null,
        pb: pb ?? null,
        roe: roe ?? null,
        marketCap: marketCap ?? null,
        foreignNetBuy: foreignNetBuy ?? null,
        week52High: week52High ?? null,
        week52Low: week52Low ?? null,
      },
    });
  } catch (error) {
    console.error("Fundamentals fetch failed:", error);
    return NextResponse.json(
      {
        success: false,
        ticker: "FPT",
        data: {
          ticker: "FPT",
          pe: null,
          pb: null,
          roe: null,
          marketCap: null,
          foreignNetBuy: null,
          week52High: null,
          week52Low: null,
        },
        message: "Unable to fetch fundamentals from TCBS Analytics.",
      },
      { status: 200 }
    );
  }
}
