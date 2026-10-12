import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symbol = typeof body?.symbol === "string" ? body.symbol : "FPT";
    const pnl = Number(body?.pnl ?? 0);
    const qty = Number(body?.qty ?? 100);
    const entryPrice = Number(body?.entryPrice ?? 0);
    const currentPrice = Number(body?.currentPrice ?? 0);

    const dimensions = [
      {
        title: "Lỗi kỹ thuật",
        verdict: pnl < 0 ? "Vào sai điểm, bỏ qua tín hiệu suy yếu." : "Chưa có thể kết luận rõ.",
        detail: `Bạn đang giao dịch ${symbol} với số lượng ${qty} cổ phiếu, giá vào ${entryPrice.toLocaleString("vi-VN")} và giá hiện tại ${currentPrice.toLocaleString("vi-VN")}. Nếu vào gần kháng cự hoặc khi momentum suy yếu, đây là lỗi kỹ thuật chủ yếu.`,
      },
      {
        title: "Lỗi vốn",
        verdict: qty * currentPrice > 3_000_000 ? "Vốn bị dồn quá mạnh vào 1 cổ phiếu." : "Đã kiểm soát mức gọi vốn tương đối tốt.",
        detail: "Mỗi khoản đầu tư nên nằm trong giới hạn tài sản khả dụng và không được vượt quá 30% vốn để tránh rủi ro tập trung.",
      },
      {
        title: "Bẫy tâm lý F0",
        verdict: pnl < 0 ? "FOMO / revenge trading có khả năng xảy ra." : "Tâm lý ổn định hơn.",
        detail: "Nếu bạn không cắt lỗ ở -5% hoặc tiếp tục gia tăng vị thế sau khi thua, đó là dấu hiệu cần chặn ngay.",
      },
    ];

    const report = {
      headline: `Khám phá nguyên nhân thua lỗ của ${symbol}: vấn đề nằm ở kỹ thuật, vốn và tâm lý.`,
      dimensions,
      checklist: [
        "Xác minh cổ phiếu đang ở vùng kháng cự/đỡ hỗ trợ và không mua khi xu hướng bị đánh gãy.",
        "Giới hạn cấp vốn theo từng cổ phiếu tối đa 30% tổng tiềm lực, không dồn quá mạnh.",
        "Đặt stop-loss từ đầu và không tăng thêm vị thế sau khi lỗ.",
        "Chờ tín hiệu xác nhận mới trước khi vào tiếp; nếu mất 5% thì cắt ngay theo SOP.",
      ],
    };

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({
      report: {
        headline: "Khám sai cho thấy lỗi kỹ thuật, vốn và tâm lý đang chồng lên nhau.",
        dimensions: [
          { title: "Lỗi kỹ thuật", verdict: "Phân tích thiếu không gian chờ xác nhận.", detail: "Không vào khi phân tích mới nổi nhưng chưa có tín hiệu xác thực." },
          { title: "Lỗi vốn", verdict: "Vốn bị tập trung quá mức.", detail: "Tỷ lệ đơn vị đầu tư cao hơn khuyến nghị. " },
          { title: "Bẫy tâm lý F0", verdict: "FOMO hoặc revenge trading.", detail: "Không cắt lỗ kịp thời khiến vị thế đẩy thêm thua lỗ." },
        ],
        checklist: [
          "Không vào lệnh khi chưa có xác nhận rõ từ mô hình kỹ thuật.",
          "Chia vốn, không đặt 1 cổ phiếu quá 30% vốn khả dụng.",
          "Stop-loss trước khi vào; không chờ đợi hy vọng.",
          "Chỉ giao dịch lại khi có quyết định theo quy trình đã được thiết lập.",
        ],
      },
    });
  }
}
