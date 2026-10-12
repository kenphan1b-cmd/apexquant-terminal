type GeminiCouncilProposal = {
  action: "MUA" | "BÁN" | "QUAN SÁT";
  ticker: string;
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  totalValue: number;
};

type GeminiCouncilPayload = {
  bull: { analysis: string; confidence: number };
  bear: { analysis: string; confidence: number };
  risk: { analysis: string; confidence: number };
  summary: string;
  tradeProposal: GeminiCouncilProposal;
};

const STOCK_REFERENCE_PRICES: Record<string, number> = {
  HPG: 25000,
  SSI: 32000,
  FPT: 136000,
  VHM: 43000,
  MWG: 51000,
  TCB: 33000,
  VNM: 68000,
  VIC: 42000,
  VCB: 72000,
  MSN: 98000,
  BID: 45000,
  CTG: 30000,
  MBB: 21000,
  VPB: 21500,
  ACB: 29000,
  STB: 34000,
  EIB: 20800,
  VND: 18000,
  GVR: 47000,
  PNJ: 110000,
  HSG: 13000,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractTickerFromQuestion(question: string, fallback: string): string {
  const source = (question || fallback || "FPT").toUpperCase();
  const candidates = source.match(/[A-Z]{2,5}/g) ?? [];
  const candidateSet = new Set<string>(candidates);
  const preferredOrder = [
    "HPG",
    "SSI",
    "FPT",
    "VHM",
    "MWG",
    "TCB",
    "VNM",
    "VIC",
    "VCB",
    "MSN",
    "BID",
    "CTG",
    "MBB",
    "VPB",
    "ACB",
    "STB",
    "EIB",
    "VND",
    "GVR",
    "PNJ",
    "HSG",
  ];

  for (const ticker of preferredOrder) {
    if (candidateSet.has(ticker)) {
      return ticker;
    }
  }

  const firstMatch = [...candidateSet].find((item) => item.length >= 2 && item.length <= 5);
  if (firstMatch) {
    return firstMatch;
  }

  return fallback || "FPT";
}

function getReferencePrice(symbol: string, marketData: any): number {
  const priceCandidates = [
    marketData?.lastPrice,
    marketData?.close,
    marketData?.price,
    marketData?.currentPrice,
    marketData?.referencePrice,
    marketData?.latestPrice,
  ];

  for (const candidate of priceCandidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return STOCK_REFERENCE_PRICES[symbol] ?? 140000;
}

function normalizeCouncilPayload(raw: any, symbol: string, marketData: any): GeminiCouncilPayload {
  const bull = raw?.bull ?? {};
  const bear = raw?.bear ?? {};
  const risk = raw?.risk ?? {};
  const tradeProposal = raw?.tradeProposal ?? {};
  const entryPrice = safeNumber(tradeProposal.entryPrice, getReferencePrice(symbol, marketData));
  const quantity = clamp(safeNumber(tradeProposal.quantity, 100), 1, 10000);
  const stopLoss = safeNumber(tradeProposal.stopLoss, Math.round(entryPrice * 0.96));
  const targetPrice = safeNumber(tradeProposal.targetPrice, Math.round(entryPrice * 1.08));
  const totalValue = safeNumber(tradeProposal.totalValue, entryPrice * quantity);

  const candidateAction = String(tradeProposal.action ?? "QUAN SÁT").toUpperCase();
  const action: GeminiCouncilProposal["action"] =
    candidateAction === "MUA" || candidateAction === "BÁN" || candidateAction === "QUAN SÁT"
      ? (candidateAction as GeminiCouncilProposal["action"])
      : "QUAN SÁT";

  return {
    bull: {
      analysis: String(bull.analysis ?? `Điểm tích cực cho ${symbol} dựa trên động lực xu hướng và khối lượng hỗ trợ.`),
      confidence: clamp(safeNumber(bull.confidence, 75), 0, 100),
    },
    bear: {
      analysis: String(bear.analysis ?? `Cảnh báo rủi ro ngắn hạn và áp lực bán quanh vùng tâm lý của ${symbol}.`),
      confidence: clamp(safeNumber(bear.confidence, 65), 0, 100),
    },
    risk: {
      analysis: String(risk.analysis ?? `Giữ mức cắt lỗ hợp lý và kiểm soát tỷ lệ rủi ro trước khi gia tăng vị thế.`),
      confidence: clamp(safeNumber(risk.confidence, 82), 0, 100),
    },
    summary: String(raw?.summary ?? `Hội đồng AI đánh giá ${symbol} theo góc nhìn kỹ thuật và rủi ro hiện tại.`),
    tradeProposal: {
      action,
      ticker: String(tradeProposal.ticker ?? symbol),
      quantity,
      entryPrice,
      stopLoss,
      targetPrice,
      totalValue,
    },
  };
}

function parseGeminiStructedOutput(rawText: string, symbol: string, marketData: any): GeminiCouncilPayload {
  const cleanedText = String(rawText ?? "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/gi, "")
    .trim();

  const parsed = JSON.parse(cleanedText || "{}");
  return normalizeCouncilPayload(parsed, symbol, marketData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const symbol = typeof body?.symbol === "string" ? body.symbol.trim() : "FPT";
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const timeframe = typeof body?.timeframe === "string" ? body.timeframe.trim() : "1D";
    const marketData = body?.marketData ?? {};
    const targetTicker = extractTickerFromQuestion(question, symbol);

    console.log("[AI Council Input]:", { question, symbol: targetTicker });

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const referencePrice = getReferencePrice(targetTicker, marketData);
    const prompt = `Bạn là Hội đồng AI phân tích chứng khoán. Hỏi: ${question || "Phân tích thị trường hiện tại"}. Mã ưu tiên: ${targetTicker}. Khung thời gian: ${timeframe}. Giá tham chiếu: ${referencePrice}. Dữ liệu thị trường: ${JSON.stringify(marketData)}.

Yêu cầu bắt buộc:
- Trả về đúng định dạng JSON thuần, không chữ chào hỏi, không markdown, không code fence.
- Chỉ trả về một object JSON với 5 field: bull, bear, risk, summary, tradeProposal.
- bull, bear, risk là object { "analysis": "...", "confidence": 80 }.
- summary là chuỗi ngắn gọn, rõ ràng.
- tradeProposal là object {
  "action": "MUA" | "BÁN" | "QUAN SÁT",
  "ticker": "${targetTicker}",
  "quantity": 100,
  "entryPrice": number,
  "stopLoss": number,
  "targetPrice": number,
  "totalValue": number
}
- Không thêm field ngoài schema. Không trả lời bằng văn bản tự do.

Schema mẫu:
{
  "bull": { "analysis": "...", "confidence": 80 },
  "bear": { "analysis": "...", "confidence": 70 },
  "risk": { "analysis": "...", "confidence": 85 },
  "summary": "...",
  "tradeProposal": {
    "action": "MUA",
    "ticker": "${targetTicker}",
    "quantity": 100,
    "entryPrice": ${referencePrice},
    "stopLoss": ${Math.round(referencePrice * 0.96)},
    "targetPrice": ${Math.round(referencePrice * 1.08)},
    "totalValue": ${Math.round(referencePrice * 100)}
  }
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: `Gemini rejected request: ${errorText}` }, { status: 502 });
    }

    const result = await response.json();
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanedText = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
    const parsed = JSON.parse(cleanedText || "{}");
    const payload = normalizeCouncilPayload(parsed, targetTicker, marketData);

    console.log("[AI Council Output parsed OK]");

    return Response.json(payload, { status: 200 });
  } catch (error) {
    console.error("[AI Council Error]:", error);
    return Response.json({ error: "Failed to generate council analysis." }, { status: 500 });
  }
}
