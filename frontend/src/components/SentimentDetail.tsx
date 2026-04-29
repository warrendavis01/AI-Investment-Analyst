"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Plus, X } from "lucide-react";
import type { SentimentDetail as SD, Theme, Headline } from "@/lib/api";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

export default function SentimentDetail({ detail }: { detail: SD }) {
  const [view, setView] = useState<"overview" | "themes" | "news">("overview");

  return (
    <div className="p-6 rounded-2xl border border-[#2a2f4a] bg-[#161927] space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Sentiment Analysis</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">{detail.summary}</p>
        </div>
        <div className="text-right shrink-0 ml-6">
          <div className={`text-3xl font-bold ${detail.score >= 30 ? "text-green-400" : detail.score >= -30 ? "text-yellow-400" : "text-red-400"}`}>
            {detail.score > 0 ? "+" : ""}{detail.score.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">−100 to +100</div>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-3 gap-3">
        <SubScore label="News Sentiment" value={detail.news_sentiment} />
        <SubScore label="Transcript Tone" value={detail.transcript_sentiment} />
        <SubScore label="Narrative Change" value={detail.narrative_change_score} decimalDigits={1} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0f1a] p-1 rounded-xl">
        {(["overview", "themes", "news"] as const).map((t) => (
          <button key={t} onClick={() => setView(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-colors
              ${view === t ? "bg-[#1e2235] text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {t === "overview" ? "Narrative Shift" : t === "themes" ? "Theme Breakdown" : "Headlines"}
          </button>
        ))}
      </div>

      {view === "overview" && <NarrativeOverview detail={detail} />}
      {view === "themes" && <ThemeBreakdown detail={detail} />}
      {view === "news" && <NewsView headlines={detail.key_headlines} />}
    </div>
  );
}

function SubScore({ label, value, decimalDigits = 0 }: { label: string; value: number; decimalDigits?: number }) {
  const color = value > 5 ? "green" : value < -5 ? "red" : "yellow";
  return (
    <div className={`bg-${color}-950/30 border border-${color}-800/40 rounded-xl p-3 text-center`}>
      <div className={`text-xl font-bold text-${color}-400`}>
        {value > 0 ? "+" : ""}{value.toFixed(decimalDigits)}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function NarrativeOverview({ detail }: { detail: SD }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Positive themes */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider">Positive Themes</h4>
        {detail.positive_themes.map((t) => (
          <div key={t} className="flex items-center gap-2 text-sm text-gray-300 bg-green-950/20 rounded-lg px-3 py-2">
            <TrendingUp className="w-3 h-3 text-green-400 shrink-0" />
            {t}
          </div>
        ))}
        {detail.new_themes.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-1">New this quarter:</p>
            {detail.new_themes.map((t) => (
              <div key={t} className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/20 rounded-lg px-3 py-1.5 mb-1">
                <Plus className="w-3 h-3 shrink-0" /> {t}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Negative themes */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Negative Themes</h4>
        {detail.negative_themes.map((t) => (
          <div key={t} className="flex items-center gap-2 text-sm text-gray-300 bg-red-950/20 rounded-lg px-3 py-2">
            <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />
            {t}
          </div>
        ))}
        {detail.removed_themes.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-1">Dropped from narrative:</p>
            {detail.removed_themes.map((t) => (
              <div key={t} className="flex items-center gap-2 text-xs text-orange-300 bg-orange-950/20 rounded-lg px-3 py-1.5 mb-1">
                <X className="w-3 h-3 shrink-0" /> {t}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeBreakdown({ detail }: { detail: SD }) {
  const radarData = detail.current_themes.slice(0, 6).map((t) => ({
    theme: t.theme.length > 20 ? t.theme.slice(0, 20) + "…" : t.theme,
    score: Math.max(0, t.theme_score + 10),
  }));

  return (
    <div className="space-y-4">
      {radarData.length > 2 && (
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#2a2f4a" />
            <PolarAngleAxis dataKey="theme" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <Radar dataKey="score" fill="#4f6ef7" fillOpacity={0.4} stroke="#4f6ef7" />
            <Tooltip contentStyle={{ background: "#1e2235", border: "1px solid #2a2f4a" }} />
          </RadarChart>
        </ResponsiveContainer>
      )}

      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Themes</h4>
        <div className="space-y-2">
          {detail.current_themes.map((t) => (
            <ThemeRow key={t.theme} theme={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeRow({ theme: t }: { theme: Theme }) {
  const [expanded, setExpanded] = useState(false);
  const color = t.sentiment > 0.5 ? "green" : t.sentiment < -0.5 ? "red" : "yellow";

  return (
    <div className={`rounded-lg border border-${color}-800/30 bg-${color}-950/10 px-3 py-2`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className="text-sm text-white">{t.theme}</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Impact: {t.importance}/5</span>
          <span>Novelty: {(t.novelty * 100).toFixed(0)}%</span>
          <span className={`font-mono text-${color}-400`}>
            {t.theme_score > 0 ? "+" : ""}{t.theme_score.toFixed(1)}
          </span>
        </div>
      </div>
      {expanded && t.quote && (
        <p className="text-xs text-gray-400 mt-2 italic border-l-2 border-gray-600 pl-2">"{t.quote}"</p>
      )}
    </div>
  );
}

function NewsView({ headlines }: { headlines: (Headline | string)[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Key Headlines</h4>
      {headlines.length === 0 && (
        <p className="text-sm text-gray-500">No headlines captured.</p>
      )}
      {headlines.map((h, i) => {
        const text = typeof h === "string" ? h : h.headline;
        const url = typeof h === "string" ? null : h.url;
        return (
          <div key={i} className="flex gap-3 text-sm text-gray-300 bg-[#1e2235] rounded-lg px-3 py-2.5 group">
            <span className="text-gray-600 shrink-0">{i + 1}.</span>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors underline-offset-2 hover:underline"
              >
                {text}
              </a>
            ) : (
              <span>{text}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
