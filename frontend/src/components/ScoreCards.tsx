"use client";

import { BarChart2, Shield, MessageSquare, ChevronDown } from "lucide-react";
import type { FundamentalDetail, AntifragileDetail, SentimentDetail } from "@/lib/api";

type Tab = "fundamental" | "antifragile" | "sentiment";

interface Props {
  fundamental: FundamentalDetail;
  antifragile: AntifragileDetail;
  sentiment: SentimentDetail;
  activeTab: Tab | null;
  onTabChange: (tab: Tab) => void;
}

export default function ScoreCards({ fundamental, antifragile, sentiment, activeTab, onTabChange }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ScoreCard
        tab="fundamental"
        active={activeTab === "fundamental"}
        onClick={() => onTabChange("fundamental")}
        icon={<BarChart2 className="w-5 h-5" />}
        label="Fundamental"
        score={fundamental.final_score}
        maxScore={100}
        minScore={-54}
        rating={fundamental.rating}
        summary={fundamental.summary}
        color={getFundamentalColor(fundamental.final_score)}
        gauge={normalizeToPercent(fundamental.final_score, -54, 100)}
      />
      <ScoreCard
        tab="antifragile"
        active={activeTab === "antifragile"}
        onClick={() => onTabChange("antifragile")}
        icon={<Shield className="w-5 h-5" />}
        label="Antifragile"
        score={antifragile.total_score}
        maxScore={17}
        minScore={-7}
        rating={antifragile.rating}
        summary={antifragile.summary}
        color={getAntifragileColor(antifragile.total_score)}
        gauge={normalizeToPercent(antifragile.total_score, -7, 17)}
      />
      <ScoreCard
        tab="sentiment"
        active={activeTab === "sentiment"}
        onClick={() => onTabChange("sentiment")}
        icon={<MessageSquare className="w-5 h-5" />}
        label="Sentiment"
        score={sentiment.score}
        maxScore={100}
        minScore={-100}
        rating={sentiment.rating}
        summary={sentiment.summary}
        color={getSentimentColor(sentiment.score)}
        gauge={normalizeToPercent(sentiment.score, -100, 100)}
      />
    </div>
  );
}

interface CardProps {
  tab: Tab;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  score: number;
  maxScore: number;
  minScore: number;
  rating: string;
  summary: string;
  color: string;
  gauge: number;
}

function ScoreCard({ tab, active, onClick, icon, label, score, maxScore, minScore, rating, summary, color, gauge }: CardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left w-full p-6 rounded-2xl border transition-all duration-200
        ${active
          ? `border-${color}-500 bg-${color}-900/20 shadow-lg shadow-${color}-900/20`
          : "border-[#2a2f4a] bg-[#161927] hover:border-[#3a3f5a]"
        }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 text-${color}-400`}>
          {icon}
          <span className="text-sm font-semibold text-gray-400">{label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${active ? "rotate-180" : ""}`} />
      </div>

      {/* Big score */}
      <div className="mb-1">
        <span className={`text-5xl font-bold text-${color}-400`}>
          {score > 0 ? "+" : ""}{score.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500 ml-2">/ {maxScore}</span>
      </div>

      {/* Rating badge */}
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-4
        bg-${color}-900/40 text-${color}-300 border border-${color}-700/40`}>
        {rating}
      </span>

      {/* Gauge bar */}
      <div className="w-full bg-[#1e2235] rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full bg-${color}-500 transition-all duration-700`}
          style={{ width: `${Math.max(2, gauge)}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{summary}</p>
    </button>
  );
}

function normalizeToPercent(val: number, min: number, max: number): number {
  return Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
}

function getFundamentalColor(score: number): string {
  if (score >= 80) return "green";
  if (score >= 70) return "yellow";
  return "red";
}

function getAntifragileColor(score: number): string {
  if (score >= 12) return "green";
  if (score >= 7) return "yellow";
  return "red";
}

function getSentimentColor(score: number): string {
  if (score >= 30) return "green";
  if (score >= -30) return "yellow";
  return "red";
}
