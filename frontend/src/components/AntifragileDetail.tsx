"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AntifragileDetail as AD, AntifragilePillar } from "@/lib/api";

export default function AntifragileDetail({ detail }: { detail: AD }) {
  const totalRange = 17 - (-7);
  const normalized = ((detail.total_score - (-7)) / totalRange) * 100;

  return (
    <div className="p-6 rounded-2xl border border-[#2a2f4a] bg-[#161927] space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Antifragile Analysis</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">{detail.summary}</p>
        </div>
        <div className="text-right shrink-0 ml-6">
          <div className="text-3xl font-bold text-white">{detail.total_score.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Range: −7 to 17</div>
        </div>
      </div>

      {/* Overall gauge */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Fragile (−7)</span>
          <span>Robust (7)</span>
          <span>Anti-Fragile (12+)</span>
        </div>
        <div className="relative w-full h-3 rounded-full overflow-hidden bg-gradient-to-r from-red-900 via-yellow-800 to-green-800">
          <div
            className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg transition-all duration-700"
            style={{ left: `${Math.max(0, Math.min(98, normalized))}%` }}
          />
        </div>
      </div>

      {/* Pillars */}
      <div className="space-y-3">
        {detail.pillars.map((pillar) => (
          <PillarSection key={pillar.name} pillar={pillar} />
        ))}
      </div>
    </div>
  );
}

function PillarSection({ pillar }: { pillar: AntifragilePillar }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#2a2f4a] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1e2235] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="font-medium text-white text-sm">{pillar.name}</span>
        </div>
        <span className="text-sm font-mono text-gray-300">
          {pillar.pillar_score > 0 ? "+" : ""}{pillar.pillar_score}
        </span>
      </button>

      {open && (
        <div className="border-t border-[#2a2f4a] divide-y divide-[#2a2f4a]">
          {pillar.items.map((item) => (
            <div key={item.name} className="px-4 py-3 bg-[#0d0f1a]/40">
              <div className="flex items-start justify-between gap-4 mb-1">
                <span className="text-sm text-white">{item.name}</span>
                <span className={`text-sm font-mono shrink-0 ${
                  item.score > 0 ? "text-green-400" : item.score < 0 ? "text-red-400" : "text-gray-400"
                }`}>
                  {item.score > 0 ? "+" : ""}{item.score} <span className="text-gray-600 text-xs">({item.min_score} to {item.max_score})</span>
                </span>
              </div>
              <p className="text-xs text-gray-400">{item.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
