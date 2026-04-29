"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchHistory, fetchAnalysisById, type HistoryEntry, type AnalysisResult } from "@/lib/api";
import { BarChart2, Shield, MessageSquare, Clock, ChevronRight, Loader2 } from "lucide-react";
import StockHeader from "@/components/StockHeader";
import ScoreCards from "@/components/ScoreCards";
import FundamentalDetail from "@/components/FundamentalDetail";
import AntifragileDetail from "@/components/AntifragileDetail";
import SentimentDetail from "@/components/SentimentDetail";

type Tab = "fundamental" | "antifragile" | "sentiment";

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [detail, setDetail] = useState<AnalysisResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchHistory().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const handleSelect = async (entry: HistoryEntry) => {
    setSelected(entry);
    setDetail(null);
    setActiveTab(null);
    setDetailLoading(true);
    try {
      const result = await fetchAnalysisById(entry.id);
      setDetail(result);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0d0f1a" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Research History</h1>

        {loading && (
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading history...
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg">No analyses yet.</p>
            <p className="text-sm mt-1">Analyze a stock to see it here.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm transition-colors"
            >
              Analyze a Stock
            </button>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar list */}
            <div className="lg:col-span-1 space-y-2">
              {entries.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  isSelected={selected?.id === entry.id}
                  onClick={() => handleSelect(entry)}
                />
              ))}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2">
              {!selected && (
                <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                  Select a stock to view its analysis
                </div>
              )}

              {detailLoading && (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  Loading analysis...
                </div>
              )}

              {detail && !detailLoading && (
                <div className="space-y-6">
                  {/* Timestamp */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-white">{detail.ticker}</span>
                      <span className="ml-3 text-gray-400 text-sm">{detail.fundamental?.summary?.slice(0, 80)}...</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {detail.created_at ? new Date(detail.created_at).toLocaleString() : ""}
                    </div>
                  </div>

                  {/* Scores */}
                  <ScoreCards
                    fundamental={detail.fundamental}
                    antifragile={detail.antifragile}
                    sentiment={detail.sentiment}
                    activeTab={activeTab}
                    onTabChange={(tab) => setActiveTab(activeTab === tab ? null : tab)}
                  />

                  {activeTab === "fundamental" && <FundamentalDetail detail={detail.fundamental} />}
                  {activeTab === "antifragile" && <AntifragileDetail detail={detail.antifragile} />}
                  {activeTab === "sentiment" && <SentimentDetail detail={detail.sentiment} />}

                  <div className="flex justify-end">
                    <button
                      onClick={() => router.push(`/analysis/${detail.ticker}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-xl transition-colors"
                    >
                      Re-analyze {detail.ticker} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({
  entry,
  isSelected,
  onClick,
}: {
  entry: HistoryEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  const fColor = scoreColor(entry.fundamental_score, 69, 79);
  const aColor = aFragColor(entry.antifragile_score);
  const sColor = sentColor(entry.sentiment_score);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all
        ${isSelected
          ? "border-brand-500 bg-brand-900/20"
          : "border-[#2a2f4a] bg-[#161927] hover:border-[#3a3f5a]"
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono font-bold text-white text-base">{entry.ticker}</span>
          <p className="text-xs text-gray-500 mt-0.5">
            {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ""}
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 mt-1 transition-transform ${isSelected ? "rotate-90 text-brand-400" : "text-gray-600"}`} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniScore icon={<BarChart2 className="w-3 h-3" />} label="Fund." score={entry.fundamental_score} color={fColor} />
        <MiniScore icon={<Shield className="w-3 h-3" />} label="Anti." score={entry.antifragile_score} color={aColor} />
        <MiniScore icon={<MessageSquare className="w-3 h-3" />} label="Sent." score={entry.sentiment_score} color={sColor} />
      </div>
    </button>
  );
}

function MiniScore({ icon, label, score, color }: { icon: React.ReactNode; label: string; score: number; color: string }) {
  return (
    <div className={`bg-${color}-950/30 border border-${color}-800/30 rounded-lg px-2 py-1.5 text-center`}>
      <div className={`flex items-center justify-center gap-1 text-${color}-400 mb-0.5`}>
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className={`text-sm font-bold text-${color}-400`}>
        {score > 0 ? "+" : ""}{score.toFixed(0)}
      </span>
    </div>
  );
}

function scoreColor(score: number, low: number, mid: number) {
  if (score > mid) return "green";
  if (score > low) return "yellow";
  return "red";
}

function aFragColor(score: number) {
  if (score >= 12) return "green";
  if (score >= 7) return "yellow";
  return "red";
}

function sentColor(score: number) {
  if (score >= 30) return "green";
  if (score >= -30) return "yellow";
  return "red";
}
