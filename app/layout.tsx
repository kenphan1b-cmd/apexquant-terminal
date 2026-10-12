import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApexQuant Terminal — VN30 & Global Tech",
  description:
    "Institutional-grade stock trading terminal for Vietnam VN30 market with AI Financial Copilot for F0 investors",
  keywords: ["stock trading", "VN30", "Vietnam", "candlestick chart", "order book", "AI analysis"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#080a0f] text-white overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
