// src/data/mockAnalysisData.ts
// Pre-seeded BCTC, news, and 6-part analysis for FPT & HPG

export interface FinancialInput {
  companyName: string;
  ticker: string;
  financialSummary: string;
  footnotes: string;
  recentNews: string;
  sectorPE: string;
  sectorPB: string;
}

export interface AnalysisOutput {
  phan1: string;
  phan2: {
    doanhThu: { label: string; value: string; note: string };
    loiNhuan: { label: string; value: string; note: string };
    bienGop: { label: string; value: string; formula: string };
    bienRong: { label: string; value: string; formula: string };
    cfo: { value: string; loiNhuanRong: string; caution: 'ok' | 'warn' | 'danger'; note: string };
    de: { value: string; note: string };
  };
  phan3: string;
  phan4: string[];
  phan5: Array<{ headline: string; tag: 'TÍCH CỰC' | 'TIÊU CỰC' | 'TRUNG LẬP'; summary: string }>;
  phan6: {
    diemManh: string[];
    diemCanLuuY: string[];
    cauHoiMo: string[];
  };
}

export interface MockPreset {
  input: FinancialInput;
  analysis: AnalysisOutput;
}

export const MOCK_PRESETS: Record<'FPT' | 'HPG', MockPreset> = {
  FPT: {
    input: {
      companyName: 'Công ty Cổ phần FPT',
      ticker: 'FPT',
      financialSummary: `BẢNG CÂN ĐỐI KẾ TOÁN (tóm tắt, tỷ đồng):
- Tổng tài sản: 72.450
- Nợ phải trả: 41.200
- Vốn chủ sở hữu: 31.250

KẾT QUẢ KINH DOANH (H1 2024 so với H1 2023):
- Doanh thu thuần: 29.865 (tăng từ 25.210 cùng kỳ)
- Lợi nhuận gộp: 11.350 (tăng từ 9.420 cùng kỳ)
- Lợi nhuận sau thuế: 3.820 (tăng từ 3.050 cùng kỳ)
- EPS pha loãng: 5.240 đồng/cổ phiếu

LƯU CHUYỂN TIỀN TỆ (H1 2024, tỷ đồng):
- CFO (lưu chuyển tiền từ hoạt động kinh doanh): +3.650
- CFI (đầu tư): -2.100
- CFF (tài chính): -980

CHỈ SỐ ĐỊNH GIÁ HIỆN TẠI:
- Giá cổ phiếu: ~130.000 đồng
- P/E hiện tại: 24.8x
- P/B hiện tại: 6.2x`,
      footnotes: `THUYẾT MINH BÁO CÁO TÀI CHÍNH:
- Nợ tiềm tàng: Bảo lãnh vay vốn cho các công ty con 1.200 tỷ đồng; không có nghĩa vụ đến hạn trong 12 tháng tới.
- Giao dịch bên liên quan: Cho thuê văn phòng từ công ty có liên quan với giá thị trường (xác nhận bởi tư vấn độc lập).
- Chính sách kế toán: Ghi nhận doanh thu phần mềm theo IFRS 15, không có thay đổi so với kỳ trước.
- Ý kiến kiểm toán: Chấp nhận toàn phần (Big4 - Ernst & Young).`,
      recentNews: `1. FPT ký hợp đồng outsourcing CNTT 500 triệu USD với đối tác Nhật Bản (07/2024)
2. FPT Education ghi nhận tăng trưởng học sinh 28% YoY trong năm học 2023-2024
3. Mảng viễn thông FPT Telecom duy trì tăng trưởng thuê bao FTTH ổn định +15% YoY
4. Fed dự kiến giảm lãi suất - hỗ trợ định giá nhóm tăng trưởng công nghệ toàn cầu
5. Rủi ro tỷ giá USD/VND ảnh hưởng tới dòng doanh thu xuất khẩu phần mềm`,
      sectorPE: '22x (ngành CNTT Việt Nam)',
      sectorPB: '4.5x (ngành CNTT Việt Nam)',
    },
    analysis: {
      phan1: `FPT Corporation là tập đoàn công nghệ hàng đầu Việt Nam, hoạt động trong 3 mảng cốt lõi: Công nghệ (IT services & outsourcing xuất khẩu), Viễn thông (FPT Telecom - internet, FTTH) và Giáo dục (FPT Education). Đây là doanh nghiệp tư nhân lớn nhất ngành công nghệ Việt Nam với doanh thu đa dạng hóa qua nhiều phân khúc. Tập đoàn có lịch sử tăng trưởng bền vững trong hơn 35 năm và đang mở rộng mạnh mẽ sang thị trường Nhật Bản, Mỹ và châu Âu trong mảng xuất khẩu phần mềm.`,
      phan2: {
        doanhThu: {
          label: 'Tăng trưởng Doanh thu H1/2024',
          value: '+18,5%',
          note: 'Tính từ: 29.865 tỷ (H1 2024) / 25.210 tỷ (H1 2023) − 1 = +18,5% YoY',
        },
        loiNhuan: {
          label: 'Tăng trưởng LNST H1/2024',
          value: '+25,2%',
          note: 'Tính từ: 3.820 tỷ (H1 2024) / 3.050 tỷ (H1 2023) − 1 = +25,2% YoY',
        },
        bienGop: {
          label: 'Biên Lợi nhuận Gộp',
          value: '38,0%',
          formula: 'Tính từ: Lợi nhuận gộp 11.350 tỷ / Doanh thu thuần 29.865 tỷ = 38,0%',
        },
        bienRong: {
          label: 'Biên Lợi nhuận Ròng',
          value: '12,8%',
          formula: 'Tính từ: LNST 3.820 tỷ / Doanh thu thuần 29.865 tỷ = 12,8%',
        },
        cfo: {
          value: '+3.650 tỷ đồng',
          loiNhuanRong: '3.820 tỷ đồng',
          caution: 'ok',
          note: 'CFO (+3.650 tỷ) xấp xỉ Lợi nhuận ròng (3.820 tỷ) — chênh lệch 4,5%. Dòng tiền kinh doanh khỏe mạnh, phù hợp với lợi nhuận ghi nhận. Không có dấu hiệu bất thường.',
        },
        de: {
          value: '1,32x',
          note: 'Tính từ: Nợ phải trả 41.200 tỷ / Vốn chủ sở hữu 31.250 tỷ = 1,32x. Mức này khá phổ biến với tập đoàn đa mảng có đòn bẩy vừa phải.',
        },
      },
      phan3: `P/E hiện tại: 24,8x | P/E ngành CNTT Việt Nam: 22x → FPT đang giao dịch ở mức PREMIUM ~12,7% so với trung bình ngành. P/B hiện tại: 6,2x | P/B ngành: 4,5x → Premium ~37,8%. Điều này có thể phản ánh kỳ vọng tăng trưởng cao hơn trung bình ngành do mảng outsourcing xuất khẩu phần mềm đang tăng tốc. Tuy nhiên, đây là phân tích khách quan so sánh số liệu — không phải đánh giá nên mua hay bán.`,
      phan4: [
        'Bảo lãnh vay vốn cho công ty con: 1.200 tỷ đồng — cần theo dõi tình hình tài chính các đơn vị được bảo lãnh.',
        'Giao dịch cho thuê văn phòng bên liên quan: Dù được xác nhận giá thị trường bởi tư vấn độc lập, cần chú ý tính minh bạch trong dài hạn.',
        'Rủi ro tỷ giá: Mảng xuất khẩu phần mềm (doanh thu USD) có thể bị ảnh hưởng nếu USD/VND biến động mạnh — chưa có thông tin cụ thể về chính sách hedge tỷ giá trong dữ liệu cung cấp.',
        'Ý kiến kiểm toán: Chấp nhận toàn phần (Ernst & Young) — không có ghi chú đáng lo ngại.',
      ],
      phan5: [
        {
          headline: 'FPT ký hợp đồng outsourcing 500 triệu USD với đối tác Nhật Bản',
          tag: 'TÍCH CỰC',
          summary: 'Hợp đồng lớn củng cố vị thế của FPT tại thị trường Nhật — thị trường xuất khẩu phần mềm lớn nhất của FPT.',
        },
        {
          headline: 'FPT Education tăng trưởng học sinh 28% YoY',
          tag: 'TÍCH CỰC',
          summary: 'Mảng giáo dục tiếp tục tăng trưởng mạnh, đóng góp vào đa dạng hóa doanh thu.',
        },
        {
          headline: 'FPT Telecom tăng trưởng thuê bao FTTH +15% YoY',
          tag: 'TÍCH CỰC',
          summary: 'Mảng viễn thông ổn định, doanh thu định kỳ (recurring revenue) giúp ổn định dòng tiền.',
        },
        {
          headline: 'Fed dự kiến giảm lãi suất — hỗ trợ nhóm tăng trưởng công nghệ',
          tag: 'TRUNG LẬP',
          summary: 'Môi trường lãi suất thấp thường có lợi cho định giá nhóm tăng trưởng, nhưng cần xem xét tác động thực tế tới doanh nghiệp.',
        },
        {
          headline: 'Rủi ro tỷ giá USD/VND ảnh hưởng doanh thu xuất khẩu',
          tag: 'TIÊU CỰC',
          summary: 'Biến động tỷ giá có thể làm giảm giá trị doanh thu khi quy đổi về VND. Cần theo dõi chính sách hedge của công ty.',
        },
      ],
      phan6: {
        diemManh: [
          'Tăng trưởng doanh thu và lợi nhuận mạnh (>18% và >25% YoY trong H1 2024), vượt trội so với nhiều doanh nghiệp cùng ngành.',
          'Dòng tiền kinh doanh (CFO) lành mạnh, bám sát lợi nhuận — dấu hiệu chất lượng lợi nhuận tốt.',
          'Đa dạng hóa doanh thu qua 3 mảng (Công nghệ, Viễn thông, Giáo dục) giúp giảm rủi ro tập trung.',
        ],
        diemCanLuuY: [
          'Định giá P/E và P/B đang ở mức premium so với trung bình ngành — cần tìm hiểu thêm liệu mức premium có bền vững không.',
          'Bảo lãnh vay vốn cho công ty con 1.200 tỷ đồng là nghĩa vụ tiềm tàng cần theo dõi.',
          'Rủi ro tỷ giá USD/VND chưa được làm rõ chính sách phòng ngừa — cần đọc thêm thuyết minh chi tiết.',
        ],
        cauHoiMo: [
          'Tốc độ tăng trưởng mảng outsourcing phần mềm xuất khẩu có thể duy trì ở mức 20%+ trong 3-5 năm tới không? Công ty có kế hoạch mở rộng sang thị trường nào?',
          'Tỷ lệ D/E 1,32x — phần lớn là nợ vay tài chính hay nợ thương mại? Cơ cấu nợ theo kỳ hạn như thế nào?',
          'Biên lợi nhuận ròng 12,8% — trong 3 năm qua, xu hướng biên này đang mở rộng hay thu hẹp?',
        ],
      },
    },
  },
  HPG: {
    input: {
      companyName: 'Công ty Cổ phần Tập đoàn Hòa Phát',
      ticker: 'HPG',
      financialSummary: `BẢNG CÂN ĐỐI KẾ TOÁN (tóm tắt, tỷ đồng):
- Tổng tài sản: 183.500
- Nợ phải trả: 108.200
- Vốn chủ sở hữu: 75.300

KẾT QUẢ KINH DOANH (H1 2024 so với H1 2023):
- Doanh thu thuần: 64.800 (tăng từ 52.300 cùng kỳ)
- Lợi nhuận gộp: 10.560 (tăng từ 6.890 cùng kỳ)
- Lợi nhuận sau thuế: 5.120 (tăng từ 1.980 cùng kỳ)
- EPS pha loãng: 1.065 đồng/cổ phiếu

LƯU CHUYỂN TIỀN TỆ (H1 2024, tỷ đồng):
- CFO (lưu chuyển tiền từ hoạt động kinh doanh): +2.180
- CFI (đầu tư): -8.450 (đầu tư Khu liên hợp Dung Quất 2)
- CFF (tài chính): +6.100 (huy động vay dài hạn)

CHỈ SỐ ĐỊNH GIÁ HIỆN TẠI:
- Giá cổ phiếu: ~27.000 đồng
- P/E hiện tại: 12.7x (annualized)
- P/B hiện tại: 1.7x`,
      footnotes: `THUYẾT MINH BÁO CÁO TÀI CHÍNH:
- Nợ tiềm tàng: Không có bảo lãnh vay vốn bên thứ ba đáng kể ngoài thông thường.
- Giao dịch bên liên quan: Mua nguyên vật liệu (quặng sắt) từ công ty liên kết với giá thị trường quốc tế.
- Chính sách kế toán: Hàng tồn kho theo phương pháp bình quân gia quyền, không thay đổi.
- Ý kiến kiểm toán: Chấp nhận toàn phần (Deloitte). Có nhấn mạnh về khoản đầu tư lớn vào Dung Quất 2 và rủi ro giá thép chu kỳ.
- Tổng vốn đầu tư Khu liên hợp Dung Quất 2: ~85.000 tỷ đồng, dự kiến hoàn thành 2025-2026.`,
      recentNews: `1. Hòa Phát xuất khẩu thép HRC sang Mỹ, EU — đối mặt nguy cơ điều tra chống phá giá (08/2024)
2. Giá thép xây dựng tại Trung Quốc tiếp tục xu hướng giảm, tạo áp lực cạnh tranh nhập khẩu
3. Thị trường bất động sản Việt Nam hồi phục chậm — ảnh hưởng tiêu thụ thép nội địa
4. Dung Quất 2 đạt tiến độ xây dựng 60% — cột mốc quan trọng trong lộ trình mở rộng
5. Chính phủ Việt Nam đẩy mạnh đầu tư công hạ tầng — hỗ trợ nhu cầu thép dài nội địa`,
      sectorPE: '15x (ngành Thép Việt Nam, trung bình 5 năm)',
      sectorPB: '1.5x (ngành Thép Việt Nam)',
    },
    analysis: {
      phan1: `Tập đoàn Hòa Phát (HPG) là doanh nghiệp thép tư nhân lớn nhất Việt Nam và top 50 nhà sản xuất thép thế giới, với chuỗi giá trị tích hợp dọc từ luyện gang, luyện thép đến cán thép thành phẩm. Sản phẩm chính bao gồm thép xây dựng (thép dài), thép cuộn cán nóng (HRC) và các sản phẩm liên quan. HPG đang trong giai đoạn đầu tư lớn với Khu liên hợp Dung Quất 2, dự kiến tăng gấp đôi công suất khi hoàn thành. Đây là doanh nghiệp có tính chu kỳ cao, phụ thuộc vào giá thép và nhu cầu xây dựng/hạ tầng.`,
      phan2: {
        doanhThu: {
          label: 'Tăng trưởng Doanh thu H1/2024',
          value: '+23,9%',
          note: 'Tính từ: 64.800 tỷ (H1 2024) / 52.300 tỷ (H1 2023) − 1 = +23,9% YoY',
        },
        loiNhuan: {
          label: 'Tăng trưởng LNST H1/2024',
          value: '+158,6%',
          note: 'Tính từ: 5.120 tỷ (H1 2024) / 1.980 tỷ (H1 2023) − 1 = +158,6% YoY. Lưu ý: cơ sở so sánh thấp do H1 2023 là đáy chu kỳ thép.',
        },
        bienGop: {
          label: 'Biên Lợi nhuận Gộp',
          value: '16,3%',
          formula: 'Tính từ: Lợi nhuận gộp 10.560 tỷ / Doanh thu thuần 64.800 tỷ = 16,3%',
        },
        bienRong: {
          label: 'Biên Lợi nhuận Ròng',
          value: '7,9%',
          formula: 'Tính từ: LNST 5.120 tỷ / Doanh thu thuần 64.800 tỷ = 7,9%',
        },
        cfo: {
          value: '+2.180 tỷ đồng',
          loiNhuanRong: '5.120 tỷ đồng',
          caution: 'warn',
          note: 'CẢNH BÁO: CFO (+2.180 tỷ) thấp hơn đáng kể so với Lợi nhuận ròng (5.120 tỷ) — chênh lệch 57%. Điều này có thể do tăng vốn lưu động phục vụ sản xuất mở rộng. Cần đọc chi tiết thuyết minh dòng tiền để xác nhận nguyên nhân.',
        },
        de: {
          value: '1,44x',
          note: 'Tính từ: Nợ phải trả 108.200 tỷ / Vốn chủ sở hữu 75.300 tỷ = 1,44x. Mức D/E tăng lên do vay huy động tài trợ cho Dung Quất 2. Cần theo dõi khả năng trả nợ khi dự án đi vào hoạt động.',
        },
      },
      phan3: `P/E hiện tại: 12,7x (annualized) | P/E ngành thép Việt Nam trung bình 5 năm: 15x → HPG đang giao dịch THẤP HƠN ~15,3% so với trung bình ngành. P/B hiện tại: 1,7x | P/B ngành: 1,5x → HPG giao dịch NHẸ TRÊN trung bình ngành ~13,3%. Sự khác biệt giữa P/E và P/B có thể phản ánh kỳ vọng lợi nhuận chu kỳ — đây là quan sát khách quan, không phải khuyến nghị đầu tư.`,
      phan4: [
        'Kiểm toán NHẤN MẠNH rủi ro giá thép chu kỳ và khoản đầu tư lớn vào Dung Quất 2 (~85.000 tỷ) — đây là rủi ro thực hiện (execution risk) quan trọng.',
        'CFO thấp hơn nhiều so với lợi nhuận ròng (+2.180 vs +5.120 tỷ) — cần đọc chi tiết biến động vốn lưu động để hiểu rõ nguyên nhân.',
        'Huy động vay dài hạn 6.100 tỷ trong H1 2024 để tài trợ Dung Quất 2 — tổng nợ tăng lên, cần theo dõi chi phí lãi vay và khả năng tái cơ cấu nợ.',
        'Rủi ro xuất khẩu thép HRC sang Mỹ/EU: Đang đối mặt nguy cơ điều tra chống phá giá — nếu bị áp thuế có thể ảnh hưởng kênh xuất khẩu.',
      ],
      phan5: [
        {
          headline: 'Dung Quất 2 đạt tiến độ xây dựng 60%',
          tag: 'TÍCH CỰC',
          summary: 'Tiến độ dự án khả quan, nếu hoàn thành đúng hạn sẽ tăng gấp đôi công suất và hạ chi phí sản xuất nhờ quy mô.',
        },
        {
          headline: 'Chính phủ đẩy mạnh đầu tư công hạ tầng',
          tag: 'TÍCH CỰC',
          summary: 'Nhu cầu thép dài cho hạ tầng (cầu đường, công trình công cộng) có thể hỗ trợ tiêu thụ nội địa.',
        },
        {
          headline: 'HPG xuất khẩu HRC sang Mỹ, EU — nguy cơ điều tra chống phá giá',
          tag: 'TIÊU CỰC',
          summary: 'Rủi ro thuế phòng vệ thương mại có thể hạn chế khả năng xuất khẩu và gây áp lực lên giá bán.',
        },
        {
          headline: 'Giá thép Trung Quốc tiếp tục giảm — áp lực cạnh tranh nhập khẩu',
          tag: 'TIÊU CỰC',
          summary: 'Thép giá rẻ từ Trung Quốc có thể cạnh tranh với sản phẩm HPG trên thị trường Việt Nam và xuất khẩu.',
        },
        {
          headline: 'Thị trường bất động sản Việt Nam phục hồi chậm',
          tag: 'TRUNG LẬP',
          summary: 'Phụ thuộc tốc độ hồi phục BĐS — ảnh hưởng trực tiếp tới tiêu thụ thép xây dựng nội địa.',
        },
      ],
      phan6: {
        diemManh: [
          'Tăng trưởng lợi nhuận vượt trội (+158,6% YoY) nhờ giá thép phục hồi và kiểm soát chi phí tốt hơn.',
          'Vị thế dẫn đầu thị trường trong nước với chuỗi giá trị tích hợp dọc — lợi thế cạnh tranh cấu trúc bền vững.',
          'Dự án Dung Quất 2 theo tiến độ — khi hoàn thành sẽ tăng mạnh công suất và cải thiện biên lợi nhuận nhờ kinh tế quy mô.',
        ],
        diemCanLuuY: [
          'CFO thấp hơn đáng kể lợi nhuận ròng (2.180 vs 5.120 tỷ) — chất lượng lợi nhuận cần kiểm chứng thêm qua biến động vốn lưu động.',
          'Đòn bẩy tài chính tăng lên (D/E 1,44x) do vay lớn tài trợ Dung Quất 2 — rủi ro tài chính cần theo dõi trong môi trường lãi suất biến động.',
          'Rủi ro chu kỳ ngành thép và rủi ro thương mại (chống phá giá) có thể tác động không lường trước tới doanh thu xuất khẩu.',
        ],
        cauHoiMo: [
          'Dự án Dung Quất 2 khi hoàn thành sẽ tác động như thế nào tới chi phí sản xuất trên mỗi tấn thép và biên lợi nhuận gộp so với hiện tại?',
          'HPG có chính sách phòng ngừa rủi ro giá nguyên liệu (quặng sắt, than coke) như thế nào? Tỷ lệ tự cung nguyên liệu hiện ở mức nào?',
          'Nếu ngành thép bước vào giai đoạn giá giảm mạnh (như 2022-2023), HPG có thể duy trì khả năng trả nợ với mức vay hiện tại không?',
        ],
      },
    },
  },
};
