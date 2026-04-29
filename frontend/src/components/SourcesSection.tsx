"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, Database, FileText, Newspaper, Mic } from "lucide-react";
import type { Source } from "@/lib/api";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Market Data":        <Database className="w-3.5 h-3.5" />,
  "SEC Filing":         <FileText className="w-3.5 h-3.5" />,
  "SEC Filings":        <FileText className="w-3.5 h-3.5" />,
  "Earnings Transcript":<Mic className="w-3.5 h-3.5" />,
  "News":               <Newspaper className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Market Data":         "blue",
  "SEC Filing":          "orange",
  "SEC Filings":         "orange",
  "Earnings Transcript": "purple",
  "News":                "gray",
};

export default function SourcesSection({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);

  // Group by category
  const grouped: Record<string, Source[]> = {};
  for (const s of sources) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  const totalCount = sources.length;

  return (
    <div className="rounded-2xl border border-[#2a2f4a] bg-[#161927] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1e2235] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-white">Data Sources</span>
          <span className="text-xs bg-[#1e2235] text-gray-400 border border-[#2a2f4a] px-2 py-0.5 rounded-full">
            {totalCount} sources
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-[#2a2f4a] px-6 py-5 space-y-5">
          {Object.entries(grouped).map(([category, items]) => {
            const color = CATEGORY_COLORS[category] || "gray";
            const icon = CATEGORY_ICONS[category] || <Database className="w-3.5 h-3.5" />;
            return (
              <div key={category}>
                <div className={`flex items-center gap-2 text-${color}-400 mb-2`}>
                  {icon}
                  <h4 className="text-xs font-semibold uppercase tracking-wider">{category}</h4>
                </div>
                <div className="space-y-1.5">
                  {items.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-4 group px-3 py-2.5 rounded-lg
                        bg-[#0d0f1a] hover:bg-[#1e2235] border border-transparent hover:border-[#2a2f4a]
                        transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 group-hover:text-white transition-colors truncate">
                          {s.label}
                        </p>
                        {s.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{s.description}</p>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
