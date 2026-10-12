"use client";

import { Bot, SendHorizonal, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { TradeProposalCard } from "@/src/types/market";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface AICopilotChatProps {
  marketData?: Record<string, unknown>;
  activeTicker?: string;
  currentPrice?: number;
  onTradeProposal?: (proposal: TradeProposalCard) => void;
  onApproveTrade?: (proposal: TradeProposalCard) => void;
}

const SYSTEM_PROMPT =
  "Bạn là Dr. Apex — Chuyên gia định lượng cấp cao. Hỏi gì đáp nấy bằng tiếng Việt tự nhiên, sâu sắc, trực diện, theo thực tế thị trường và cấu trúc giá.";

function getContextLabel(marketData?: Record<string, unknown>) {
  const symbol = String(marketData?.symbol ?? "FPT").toUpperCase();
  const view = marketData?.view || marketData?.widget || "TradingChart";
  return `📍 Đang soi: [${view} - ${symbol}]`;
}

function MarkdownBlock({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n\s*[-•]\s+/g, "\n• ")
    .replace(/\n/g, "<br />");

  return <div className="text-sm leading-6 text-slate-200" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function AICopilotChat({ marketData, activeTicker, currentPrice, onTradeProposal, onApproveTrade }: AICopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `${SYSTEM_PROMPT}\n\nTôi đang quan sát ${getContextLabel(marketData)}. Hãy hỏi bằng tiếng Việt tự nhiên như: “mã VHM hôm nay ra sao”, “FPT vào giá này có hợp không”, hoặc “ACB và FPT nên chọn mã nào”.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const contextLabel = useMemo(() => getContextLabel(marketData), [marketData]);

  const sendPrompt = async (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const resolvedTicker = String(activeTicker ?? marketData?.symbol ?? "FPT").trim().toUpperCase() || "FPT";
      const resolvedPrice = Number(currentPrice ?? marketData?.lastPrice ?? marketData?.price ?? marketData?.close ?? 0);

      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          ticker: resolvedTicker,
          currentPrice: resolvedPrice,
          fundamentals: marketData?.fundamentals ?? {},
          recentCandles: Array.isArray(marketData?.recentCandles) ? marketData.recentCandles : [],
          symbol: resolvedTicker,
          context: marketData ?? {},
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        reply?: string;
        markdown?: string;
        error?: string;
        content?: string;
      };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.error ?? "AI runtime failed");
      }

      const assistantText = payload.reply ?? payload.markdown ?? payload.content ?? "Dr. Apex đã xử lý yêu cầu của bạn.";

      const proposalCandidate = payload as Partial<TradeProposalCard> & { ticker?: string; action?: string; side?: string; symbol?: string };
      const hasValidProposal = !!(
        proposalCandidate &&
        (proposalCandidate.ticker || proposalCandidate.symbol) &&
        (proposalCandidate.action || proposalCandidate.side) &&
        Number.isFinite(Number(proposalCandidate.quantity)) &&
        Number.isFinite(Number(proposalCandidate.targetPrice))
      );

      if (hasValidProposal) {
        onTradeProposal?.(proposalCandidate as TradeProposalCard);
        onApproveTrade?.(proposalCandidate as TradeProposalCard);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: assistantText,
        },
      ]);
    } catch (error) {
      console.error("AI Copilot request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-fallback-${Date.now()}`,
          role: "assistant",
          text: error instanceof Error && error.message ? error.message : "Dr. Apex đang gặp chậm tín hiệu. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-full rounded-[22px] border border-violet-500/20 bg-[#0b0d12]/80 shadow-[0_0_40px_rgba(59,130,246,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#151a2a] via-[#0d1320] to-[#101827] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-violet-500 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <Bot size={18} className="text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              Dr. Apex
              <span className="text-emerald-400">[ONLINE]</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-300/80">{contextLabel}</div>
          </div>
        </div>
      </div>

      <div className="max-h-[420px] min-h-[320px] space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-2xl border px-3 py-2.5 shadow-[0_0_25px_rgba(15,23,42,0.35)] ${
                message.role === "user"
                  ? "border-violet-500/30 bg-gradient-to-br from-violet-500/25 to-cyan-500/10 text-white"
                  : "border-cyan-500/20 bg-[#0b1220]/90 text-slate-200"
              }`}
            >
              <div className="mb-1.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-slate-400">
                {message.role === "user" ? <User size={10} /> : <Bot size={10} />}
                {message.role === "user" ? "Trader" : "Dr. Apex"}
              </div>

              <MarkdownBlock text={message.text} />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-cyan-500/20 bg-[#0b1220]/90 px-3 py-2 text-sm text-cyan-300">
              Dr. Apex đang phân tích tín hiệu và chuẩn bị quyết định...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-[#0b0d12]/70 p-3">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#111827]/80 p-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void sendPrompt(input);
              }
            }}
            className="h-10 flex-1 bg-transparent px-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            placeholder="Hỏi Dr. Apex bất kỳ điều gì về thị trường, vị thế, mã đang xem..."
          />
          <button
            type="button"
            onClick={() => void sendPrompt(input)}
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizonal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
