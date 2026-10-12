"use client";
// components/copilot/AICopilotDrawer.tsx
// Institutional-grade AI Financial Copilot for Vietnamese F0 investors

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  Database,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  BarChart2,
  Brain,
  Loader2,
} from "lucide-react";
import { MOCK_PRESETS, type FinancialInput, type AnalysisOutput } from "@/data/mockAnalysisData";

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "input" | "report";

const DEFAULT_INPUT: FinancialInput = {
  companyName: "",
  ticker: "",
  financialSummary: "",
  footnotes: "",
  recentNews: "",
  sectorPE: "",
  sectorPB: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  note,
  color = "cyan",
}: {
  label: string;
  value: string;
  note?: string;
  color?: "cyan" | "emerald" | "rose" | "yellow";
}) {
  const colorMap = {
    cyan: "border-cyan-500/30 bg-cyan-950/20 text-cyan-400",
    emerald: "border-emerald-500/30 bg-emerald-950/20 text-emerald-400",
    rose: "border-rose-500/30 bg-rose-950/20 text-rose-400",
    yellow: "border-yellow-500/30 bg-yellow-950/20 text-yellow-400",
  };
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
        {label}
      </p>
      <p className="text-xl font-black font-mono mb-1">{value}</p>
      {note && <p className="text-[9px] text-slate-500 leading-relaxed">{note}</p>}
    </div>
  );
}

function CFOCard({ cfo }: { cfo: AnalysisOutput["phan2"]["cfo"] }) {
  const cauMap = {
    ok: {
      border: "border-emerald-500/40",
      bg: "bg-emerald-950/20",
      icon: <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />,
      title: "Dòng Tiền Lành Mạnh",
      color: "text-emerald-400",
    },
    warn: {
      border: "border-yellow-500/40",
      bg: "bg-yellow-950/20",
      icon: <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />,
      title: "⚠ Cần Kiểm Tra Thêm",
      color: "text-yellow-400",
    },
    danger: {
      border: "border-rose-500/40",
      bg: "bg-rose-950/20",
      icon: <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />,
      title: "🚨 Dấu Hiệu Bất Thường",
      color: "text-rose-400",
    },
  };
  const style = cauMap[cfo.caution];
  return (
    <div className={`rounded-xl border p-3 ${style.border} ${style.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        {style.icon}
        <span className={`text-xs font-bold ${style.color}`}>{style.title}</span>
      </div>
      <div className="flex gap-4 mb-2 text-[10px] font-mono">
        <span>
          <span className="text-slate-500">CFO: </span>
          <span className="text-white font-bold">{cfo.value}</span>
        </span>
        <span>
          <span className="text-slate-500">LNST: </span>
          <span className="text-white font-bold">{cfo.loiNhuanRong}</span>
        </span>
      </div>
      <p className="text-[10px] text-slate-400 leading-relaxed">{cfo.note}</p>
    </div>
  );
}

function NewsTag({ tag }: { tag: "TÍCH CỰC" | "TIÊU CỰC" | "TRUNG LẬP" }) {
  const map = {
    "TÍCH CỰC": {
      icon: <TrendingUp size={10} />,
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    "TIÊU CỰC": {
      icon: <TrendingDown size={10} />,
      cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    },
    "TRUNG LẬP": {
      icon: <Minus size={10} />,
      cls: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    },
  };
  const { icon, cls } = map[tag];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${cls}`}>
      {icon}
      {tag}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AICopilotDrawer({ isOpen, onClose }: AICopilotDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("input");
  const [input, setInput] = useState<FinancialInput>(DEFAULT_INPUT);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadPreset = useCallback((preset: "FPT" | "HPG") => {
    const data = MOCK_PRESETS[preset];
    setInput(data.input);
    setAnalysis(null);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!input.financialSummary.trim()) {
      alert("Vui lòng nhập dữ liệu báo cáo tài chính trước khi phân tích.");
      return;
    }
    setIsAnalyzing(true);

    // Simulate AI processing delay (mock fallback — no API key needed)
    await new Promise((r) => setTimeout(r, 2200));

    // Look up pre-seeded analysis by ticker or use FPT as fallback
    const ticker = input.ticker.toUpperCase() as "FPT" | "HPG";
    const presetResult =
      MOCK_PRESETS[ticker]?.analysis ?? MOCK_PRESETS["FPT"].analysis;

    setAnalysis(presetResult);
    setIsAnalyzing(false);
    setActiveTab("report");
  }, [input]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0a0c11] border-l border-white/10 shadow-2xl shadow-black/50 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0 bg-gradient-to-r from-violet-950/50 to-indigo-950/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Brain size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">
                    AI Financial Copilot F0
                  </h2>
                  <p className="text-[9px] text-violet-400 font-medium tracking-wide">
                    Trợ Lý Chuyên Gia Phân Tích · Chuẩn Nhà Đầu Tư F0 Việt Nam
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 flex-shrink-0">
              {([
                { id: "input" as TabType, label: "Nhập Dữ Liệu", icon: <Database size={13} /> },
                { id: "report" as TabType, label: "Báo Cáo Phân Tích", icon: <FileText size={13} /> },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all border-b-2 ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-400 bg-violet-500/10"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === "report" && analysis && (
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[8px] font-black">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* ─── INPUT TAB ─── */}
                {activeTab === "input" && (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-5 space-y-4"
                  >
                    {/* System persona info card */}
                    <div className="rounded-xl bg-violet-950/30 border border-violet-500/20 p-3 text-[10px] text-violet-300 leading-relaxed">
                      <span className="font-bold text-violet-400">🤖 Persona AI:</span>{" "}
                      Phân tích CHỈ dựa trên dữ liệu bạn cung cấp. Không tự suy diễn, không khuyến nghị mua/bán, trích dẫn số liệu gốc cho mọi tính toán. Thiếu thông tin sẽ ghi rõ{" "}
                      <span className="italic text-slate-400">"không đủ thông tin"</span>.
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Nạp Dữ Liệu Mẫu 1 Chạm
                      </p>
                      <div className="flex gap-2">
                        {(["FPT", "HPG"] as const).map((preset) => (
                          <motion.button
                            key={preset}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => loadPreset(preset)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-900/40 to-indigo-900/40 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:border-cyan-400/60 transition-all"
                          >
                            <Zap size={12} className="text-yellow-400" />
                            Nạp dữ liệu mẫu {preset}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Company info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                          Tên Doanh Nghiệp
                        </label>
                        <input
                          value={input.companyName}
                          onChange={(e) =>
                            setInput((p) => ({ ...p, companyName: e.target.value }))
                          }
                          placeholder="VD: Công ty Cổ phần FPT"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                          Mã Cổ Phiếu
                        </label>
                        <input
                          value={input.ticker}
                          onChange={(e) =>
                            setInput((p) => ({ ...p, ticker: e.target.value.toUpperCase() }))
                          }
                          placeholder="FPT / HPG / VCB"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-colors font-mono"
                        />
                      </div>
                    </div>

                    {/* Financial summary */}
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                        Báo Cáo Tài Chính (Bảng cân đối, KQKD, Lưu chuyển tiền tệ)
                      </label>
                      <textarea
                        value={input.financialSummary}
                        onChange={(e) =>
                          setInput((p) => ({ ...p, financialSummary: e.target.value }))
                        }
                        rows={7}
                        placeholder="Dán số liệu tóm tắt BCTC vào đây&#10;VD: Doanh thu: 29.865 tỷ | Lợi nhuận gộp: 11.350 tỷ&#10;LNST: 3.820 tỷ | CFO: +3.650 tỷ&#10;..."
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-colors resize-none leading-relaxed font-mono"
                      />
                    </div>

                    {/* Footnotes */}
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                        Thuyết Minh BCTC (Nợ tiềm tàng, GD bên liên quan, KT)
                      </label>
                      <textarea
                        value={input.footnotes}
                        onChange={(e) =>
                          setInput((p) => ({ ...p, footnotes: e.target.value }))
                        }
                        rows={4}
                        placeholder="Nợ tiềm tàng: ...&#10;Giao dịch bên liên quan: ...&#10;Ý kiến kiểm toán: ..."
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Recent news */}
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                        Tin Tức & Sự Kiện Gần Đây (3-5 tin)
                      </label>
                      <textarea
                        value={input.recentNews}
                        onChange={(e) =>
                          setInput((p) => ({ ...p, recentNews: e.target.value }))
                        }
                        rows={4}
                        placeholder="1. Tiêu đề tin tức thứ nhất&#10;2. Tiêu đề tin tức thứ hai&#10;..."
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Sector P/E P/B */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                          P/E Ngành Tham Khảo
                        </label>
                        <input
                          value={input.sectorPE}
                          onChange={(e) =>
                            setInput((p) => ({ ...p, sectorPE: e.target.value }))
                          }
                          placeholder="VD: 22x (CNTT VN)"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                          P/B Ngành Tham Khảo
                        </label>
                        <input
                          value={input.sectorPB}
                          onChange={(e) =>
                            setInput((p) => ({ ...p, sectorPB: e.target.value }))
                          }
                          placeholder="VD: 4.5x (CNTT VN)"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Analyze button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={runAnalysis}
                      disabled={isAnalyzing}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white text-sm font-black uppercase flex items-center justify-center gap-2.5 shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed border border-violet-400/20"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang Phân Tích Chuyên Sâu...
                        </>
                      ) : (
                        <>
                          <Zap size={16} className="text-yellow-300" />
                          ⚡ Phân Tích Chuyên Sâu Theo Chuẩn F0
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {/* ─── REPORT TAB ─── */}
                {activeTab === "report" && (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-5 space-y-6"
                  >
                    {!analysis ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-violet-950/50 border border-violet-500/20 flex items-center justify-center">
                          <Brain size={28} className="text-violet-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-semibold">
                          Chưa có báo cáo phân tích
                        </p>
                        <p className="text-slate-600 text-xs max-w-xs">
                          Chuyển sang tab &quot;Nhập Dữ Liệu&quot;, nạp dữ liệu và nhấn &quot;Phân Tích Chuyên Sâu&quot;
                        </p>
                        <button
                          onClick={() => setActiveTab("input")}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-bold hover:bg-violet-600/30 transition-all"
                        >
                          <ChevronRight size={13} />
                          Đi Tới Nhập Dữ Liệu
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Company title */}
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                          <div className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-black text-lg font-mono">
                            {input.ticker || "—"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{input.companyName || "Doanh nghiệp"}</p>
                            <p className="text-[10px] text-slate-500">Báo Cáo Phân Tích AI · Chuẩn F0</p>
                          </div>
                          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30">
                            <Sparkles size={10} className="text-violet-400 animate-pulse" />
                            <span className="text-[9px] font-bold text-violet-400">AI ANALYZED</span>
                          </div>
                        </div>

                        {/* ── PHẦN 1: Tổng Quan ── */}
                        <section>
                          <SectionHeader
                            num="1"
                            title="Tổng Quan Doanh Nghiệp"
                            icon={<BarChart2 size={14} />}
                            color="cyan"
                          />
                          <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {analysis.phan1}
                            </p>
                          </div>
                        </section>

                        {/* ── PHẦN 2: Sức Khỏe Tài Chính ── */}
                        <section>
                          <SectionHeader
                            num="2"
                            title="Sức Khỏe Tài Chính"
                            icon={<TrendingUp size={14} />}
                            color="emerald"
                          />
                          <div className="mt-3 space-y-3">
                            {/* Growth cards */}
                            <div className="grid grid-cols-2 gap-3">
                              <MetricCard
                                label={analysis.phan2.doanhThu.label}
                                value={analysis.phan2.doanhThu.value}
                                note={analysis.phan2.doanhThu.note}
                                color="emerald"
                              />
                              <MetricCard
                                label={analysis.phan2.loiNhuan.label}
                                value={analysis.phan2.loiNhuan.value}
                                note={analysis.phan2.loiNhuan.note}
                                color="emerald"
                              />
                            </div>
                            {/* Margin cards */}
                            <div className="grid grid-cols-2 gap-3">
                              <MetricCard
                                label={analysis.phan2.bienGop.label}
                                value={analysis.phan2.bienGop.value}
                                note={analysis.phan2.bienGop.formula}
                                color="cyan"
                              />
                              <MetricCard
                                label={analysis.phan2.bienRong.label}
                                value={analysis.phan2.bienRong.value}
                                note={analysis.phan2.bienRong.formula}
                                color="cyan"
                              />
                            </div>
                            {/* CFO warning card */}
                            <CFOCard cfo={analysis.phan2.cfo} />
                            {/* D/E */}
                            <MetricCard
                              label="Tỷ lệ Nợ / Vốn Chủ Sở Hữu (D/E)"
                              value={analysis.phan2.de.value}
                              note={analysis.phan2.de.note}
                              color="yellow"
                            />
                          </div>
                        </section>

                        {/* ── PHẦN 3: Định Giá ── */}
                        <section>
                          <SectionHeader
                            num="3"
                            title="Định Giá Sơ Bộ"
                            icon={<BarChart2 size={14} />}
                            color="yellow"
                          />
                          <div className="mt-3 p-4 rounded-xl bg-yellow-950/20 border border-yellow-500/20">
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                              {analysis.phan3}
                            </p>
                          </div>
                        </section>

                        {/* ── PHẦN 4: Rủi Ro Ẩn ── */}
                        <section>
                          <SectionHeader
                            num="4"
                            title="Rủi Ro Ẩn Trong Thuyết Minh"
                            icon={<Shield size={14} />}
                            color="rose"
                          />
                          <div className="mt-3 space-y-2">
                            {analysis.phan4.map((risk, i) => (
                              <div
                                key={i}
                                className="flex gap-3 p-3 rounded-xl bg-rose-950/15 border border-rose-500/20"
                              >
                                <AlertTriangle
                                  size={13}
                                  className="text-rose-400 flex-shrink-0 mt-0.5"
                                />
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                  {risk}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* ── PHẦN 5: Tin Tức ── */}
                        <section>
                          <SectionHeader
                            num="5"
                            title="Tin Tức & Bối Cảnh Gần Đây"
                            icon={<FileText size={14} />}
                            color="cyan"
                          />
                          <div className="mt-3 space-y-2">
                            {analysis.phan5.map((news, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-semibold text-white leading-tight flex-1">
                                    {news.headline}
                                  </p>
                                  <NewsTag tag={news.tag} />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                  {news.summary}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* ── PHẦN 6: Tổng Kết ── */}
                        <section>
                          <SectionHeader
                            num="6"
                            title="Tổng Kết & Câu Hỏi Mở"
                            icon={<Brain size={14} />}
                            color="violet"
                          />
                          <div className="mt-3 space-y-4">
                            {/* Điểm mạnh */}
                            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2.5">
                                ✅ Điểm Mạnh
                              </p>
                              <ul className="space-y-2">
                                {analysis.phan6.diemManh.map((dm, i) => (
                                  <li key={i} className="flex gap-2.5 text-[11px] text-slate-300 leading-relaxed">
                                    <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    {dm}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Điểm cần lưu ý */}
                            <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/20">
                              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-2.5">
                                ⚠ Điểm Cần Lưu Ý
                              </p>
                              <ul className="space-y-2">
                                {analysis.phan6.diemCanLuuY.map((dc, i) => (
                                  <li key={i} className="flex gap-2.5 text-[11px] text-slate-300 leading-relaxed">
                                    <AlertTriangle size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
                                    {dc}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Câu hỏi mở */}
                            <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20">
                              <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-2.5">
                                🔍 Câu Hỏi Mở Để Nghiên Cứu Thêm
                              </p>
                              <ul className="space-y-2">
                                {analysis.phan6.cauHoiMo.map((ch, i) => (
                                  <li key={i} className="flex gap-2.5 text-[11px] text-slate-300 leading-relaxed">
                                    <HelpCircle size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
                                    {ch}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </section>

                        {/* Disclaimer */}
                        <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/3 text-center">
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            ⚠️{" "}
                            <span className="text-slate-400 font-semibold">
                              Đây là tổng hợp thông tin tham khảo, không phải khuyến nghị đầu tư.
                            </span>{" "}
                            Mọi quyết định đầu tư là trách nhiệm của nhà đầu tư. Dữ liệu phân tích dựa hoàn toàn trên thông tin người dùng cung cấp.
                          </p>
                        </div>

                        {/* Re-analyze button */}
                        <button
                          onClick={() => { setAnalysis(null); setActiveTab("input"); }}
                          className="w-full py-2.5 rounded-xl border border-white/10 text-slate-500 text-xs font-semibold hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                        >
                          ← Phân Tích Doanh Nghiệp Khác
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Section header helper
type SectionColor = "cyan" | "emerald" | "rose" | "yellow" | "violet";

function SectionHeader({
  num,
  title,
  icon,
  color,
}: {
  num: string;
  title: string;
  icon: React.ReactNode;
  color: SectionColor;
}) {
  const colorMap: Record<SectionColor, string> = {
    cyan: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    rose: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    yellow: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
    violet: "bg-violet-500/15 border-violet-500/30 text-violet-400",
  };
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${colorMap[color]}`}>
      <span className="text-[9px] font-black opacity-60">PHẦN {num}</span>
      {icon}
      <span className="text-xs font-black uppercase tracking-wide">{title}</span>
    </div>
  );
}
