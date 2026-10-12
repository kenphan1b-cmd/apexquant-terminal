"use client";
// app/page.tsx — ApexQuant Terminal entry point
// Client component that dynamically loads TerminalApp with ssr:false

import NextDynamic from "next/dynamic";

const TerminalApp = NextDynamic(() => import("@/components/TerminalApp"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#080a0f]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-black font-black text-3xl shadow-2xl shadow-emerald-500/30 animate-pulse">
          A
        </div>
        <p className="text-slate-400 font-semibold text-sm">Khởi động ApexQuant Terminal...</p>
        <p className="text-slate-600 text-xs">VN30 · Global Tech · AI Copilot F0</p>
      </div>
    </div>
  ),
});

export default function TerminalPage() {
  return <TerminalApp />;
}
