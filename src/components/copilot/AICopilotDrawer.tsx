"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import AICouncilChat from "@/src/components/copilot/AICouncilChat";
import type { TradeProposalCard } from "@/src/types/market";

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  marketData?: Record<string, unknown>;
  onApproveTrade?: (proposal: TradeProposalCard) => void;
}

export default function AICopilotDrawer({ isOpen, onClose, marketData, onApproveTrade }: AICopilotDrawerProps) {
  const [proposal, setProposal] = useState<TradeProposalCard | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <motion.aside initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }} transition={{ type: "spring", stiffness: 220, damping: 26 }} className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-2xl flex-col border-l border-white/10 bg-[#080a0f]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">ApexQuant AI Council</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-violet-300">Multi-agent debate</div>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-2 text-slate-300">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <AICouncilChat
                marketData={marketData}
                onTradeProposal={setProposal}
                onApproveTrade={(proposalItem) => {
                  setProposal(proposalItem);
                  onApproveTrade?.(proposalItem);
                }}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
