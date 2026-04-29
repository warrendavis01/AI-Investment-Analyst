"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Search, BarChart2, Shield, MessageSquare } from "lucide-react";

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    router.push(`/analysis/${t}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at top, #1a1f3a 0%, #0d0f1a 70%)" }}>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <TrendingUp className="w-10 h-10 text-brand-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            AI Investment Analyst
          </h1>
        </div>
        <p className="text-lg text-gray-400 max-w-xl">
          Enter any stock ticker for a full AI-powered analysis — Fundamental quality,
          Antifragility, and Sentiment scoring in seconds.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="w-full max-w-lg mb-16">
        <div className="relative">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g. NVDA, AAPL, MSFT)"
            maxLength={10}
            className="w-full px-6 py-5 pr-36 text-xl rounded-2xl bg-[#161927] border border-[#2a2f4a]
              focus:outline-none focus:ring-2 focus:ring-brand-500 text-white placeholder-gray-600
              transition-all"
          />
          <button
            type="submit"
            disabled={loading || !ticker.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-brand-500 hover:bg-brand-600
              disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl
              flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            {loading ? "Loading..." : "Analyze"}
          </button>
        </div>
      </form>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        <FeatureCard
          icon={<BarChart2 className="w-6 h-6 text-blue-400" />}
          title="Fundamental Score"
          desc="Feroldi Quality Scorecard — moat, financials, management, and the gauntlet test"
        />
        <FeatureCard
          icon={<Shield className="w-6 h-6 text-green-400" />}
          title="Antifragile Score"
          desc="Barbell, financial fortitude & skin in the game — does this business thrive under stress?"
        />
        <FeatureCard
          icon={<MessageSquare className="w-6 h-6 text-purple-400" />}
          title="Sentiment Score"
          desc="Earnings narrative change + news analysis to surface what shifted this quarter"
        />
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl border border-[#2a2f4a] bg-[#161927]">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}
