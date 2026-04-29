"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import { runAnalysis, type AnalysisResult } from "@/lib/api";
import StockHeader from "@/components/StockHeader";
import ScoreCards from "@/components/ScoreCards";
import FundamentalDetail from "@/components/FundamentalDetail";
import AntifragileDetail from "@/components/AntifragileDetail";
import SentimentDetail from "@/components/SentimentDetail";
import PriceChart from "@/components/PriceChart";
import SourcesSection from "@/components/SourcesSection";

type Tab = "fundamental" | "antifragile" | "sentiment";

export default function AnalysisPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runAnalysis(ticker);
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticker]);

  if (loading) return <LoadingScreen ticker={ticker} />;
  if (error) return <ErrorScreen error={error} onRetry={load} onBack={() => router.push("/")} />;
  if (!data) return null;

  return (
    <div className="min-h-screen" style={{ background: "#0d0f1a" }}>
      {/* Sub-header with ticker info + re-analyze */}
      <div className="border-b border-[#2a2f4a] bg-[#0d0f1a] px-6 py-2 flex items-center gap-3">
        <span className="font-mono font-bold text-white">{ticker}</span>
        <span className="text-gray-500 text-sm">{data.market_data.name}</span>
        {data.cached && (
          <span className="text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-800/40 px-2 py-0.5 rounded-full">
            Cached
          </span>
        )}
        <button
          onClick={load}
          className="ml-auto flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Re-analyze
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <StockHeader market={data.market_data} />
          </div>
          <div className="lg:col-span-2">
            <PriceChart historical={data.market_data.historical} ticker={ticker} />
          </div>
        </div>

        <ScoreCards
          fundamental={data.fundamental}
          antifragile={data.antifragile}
          sentiment={data.sentiment}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(activeTab === tab ? null : tab)}
        />

        {activeTab === "fundamental" && <FundamentalDetail detail={data.fundamental} />}
        {activeTab === "antifragile" && <AntifragileDetail detail={data.antifragile} />}
        {activeTab === "sentiment" && <SentimentDetail detail={data.sentiment} />}

        {data.sources && data.sources.length > 0 && (
          <SourcesSection sources={data.sources} />
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ ticker }: { ticker: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#0d0f1a" }}>
      <div className="w-20 h-20 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-2xl font-bold text-white mb-2">Analyzing {ticker}</p>
        <p className="text-gray-400">Fetching data, running AI analysis...</p>
        <p className="text-gray-500 text-sm mt-1">This takes 15–30 seconds</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry, onBack }: { error: string; onRetry: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0f1a" }}>
      <div className="text-center max-w-md p-8 rounded-2xl border border-red-800/50 bg-red-950/20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
        <p className="text-gray-400 mb-6 text-sm">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onBack} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-[#2a2f4a] rounded-lg transition-colors">
            Go Home
          </button>
          <button onClick={onRetry} className="px-4 py-2 text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
