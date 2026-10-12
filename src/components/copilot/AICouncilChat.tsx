"use client";

import AICopilotChat from "@/src/components/terminal/AICopilotChat";
import type { TradeProposalCard } from "@/src/types/market";

interface AICouncilChatProps {
  marketData?: Record<string, unknown>;
  onTradeProposal?: (proposal: TradeProposalCard) => void;
  onApproveTrade?: (proposal: TradeProposalCard) => void;
}

export default function AICouncilChat(props: AICouncilChatProps) {
  return <AICopilotChat {...props} />;
}
