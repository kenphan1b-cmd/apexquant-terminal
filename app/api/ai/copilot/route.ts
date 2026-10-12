export const runtime = "nodejs";

const STOCK_TICKERS = [
  "VIC",
  "VHM",
  "FPT",
  "HPG",
  "VNM",
  "MWG",
  "SSI",
  "TCB",
  "MBB",
  "VCB",
  "BID",
  "STB",
  "VPB",
  "ACB",
  "GAS",
  "PLX",
  "MSN",
  "VRE",
  "POW",
  "SAB",
  "TPB",
  "VIB",
  "SHB",
  "GVR",
  "SSB",
  "HDB",
  "BCM",
  "LPB",
  "KDH",
] as const;

function normalizeTicker(value: string | undefined | null, fallback = "FPT") {
  const candidate = String(value ?? fallback ?? "FPT").trim().toUpperCase();
  return /^[A-Z]{2,5}$/.test(candidate) ? candidate : fallback.toUpperCase();
}

function extractMentionedTickers(message: string, fallbackTicker: string) {
  const upperMessage = message.toUpperCase();
  const matches = new Set<string>();

  for (const ticker of STOCK_TICKERS) {
    if (upperMessage.includes(ticker)) {
      matches.add(ticker);
    }
  }

  const tokenMatches = upperMessage.match(/\b[A-Z]{2,5}\b/g) ?? [];
  for (const token of tokenMatches) {
    if (STOCK_TICKERS.includes(token as (typeof STOCK_TICKERS)[number])) {
      matches.add(token);
    }
  }

  if (matches.size === 0) {
    matches.add(normalizeTicker(fallbackTicker, "FPT"));
  }

  return Array.from(matches);
}

function buildGeminiSystemPrompt(activeTicker: string, currentPrice: number, message: string) {
  const mentioned = extractMentionedTickers(message, activeTicker).join(", ");

  return `Bạn là Dr. Apex - Chuyên gia Định lượng Tài chính Cấp cao tại ApexQuant Terminal.
Đang quan sát thị trường chứng khoán Việt Nam (VN30/HOSE).
Mã đang hiển thị trên biểu đồ: ${activeTicker}, giá hiện tại: ${currentPrice.toLocaleString("vi-VN")} đ.
Mã cổ phiếu được nhắc đến trong câu hỏi: ${mentioned}.

Yêu cầu phân tích:
- Trả lời tự do, sâu sắc, trực diện vào câu hỏi của trader.
- Nếu trader so sánh hai hay nhiều mã (như ACB vs FPT): Phân tích chi tiết từng mã về nhóm ngành, dòng tiền, định giá và cấu trúc xu hướng, sau đó chốt rõ nên chọn mã nào hoặc tỷ trọng giải ngân khuyến nghị.
- Đưa ra giải pháp hành động cụ thể: vùng gom, điểm dừng lỗ (Stop Loss), mục tiêu lợi nhuận (Take Profit).
- Trình bày dạng Markdown mạch lạc, in đậm giá và các mốc quan trọng. Tuyệt đối không dùng câu dập khuôn hay nói ngắn cụt ngủn.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body?.prompt ?? body?.message ?? "").trim();

    if (!message) {
      return Response.json({
        success: false,
        error: "Câu hỏi trống. Vui lòng nhập nội dung muốn phân tích.",
      }, { status: 400 });
    }

    const activeTicker = normalizeTicker(String(body?.ticker ?? body?.symbol ?? body?.context?.symbol ?? "FPT"), "FPT");
    const currentPrice = Number(body?.currentPrice ?? body?.context?.lastPrice ?? body?.context?.price ?? body?.context?.close ?? 0);

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return Response.json(
        {
          success: false,
          error: "Thiếu GEMINI_API_KEY. Vui lòng kiểm tra file .env.local và cấu hình khóa Google Gemini trước khi gọi AI Copilot.",
        },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildGeminiSystemPrompt(activeTicker, currentPrice, message),
              },
              {
                text: `Trader hỏi: "${message}"`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMessage = data?.error?.message ?? "Google Gemini trả về lỗi.";
      return Response.json(
        {
          success: false,
          error: apiMessage,
        },
        { status: response.status }
      );
    }

    const replyText = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("\n\n")
      .trim();

    if (!replyText) {
      return Response.json(
        {
          success: false,
          error: "Gemini không trả về nội dung phản hồi hợp lệ.",
        },
        { status: 502 }
      );
    }

    return Response.json({ success: true, reply: replyText });
  } catch (error) {
    console.error("AI Copilot route failed:", error);
    return Response.json(
      {
        success: false,
        error: "AI Copilot gặp sự cố trong quá trình gọi Gemini. Vui lòng thử lại sau.",
      },
      { status: 500 }
    );
  }
}
