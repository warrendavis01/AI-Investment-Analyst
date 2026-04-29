"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { FundamentalDetail as FD, FundamentalCategory, GauntletItem } from "@/lib/api";

export default function FundamentalDetail({ detail }: { detail: FD }) {
  return (
    <div className="p-6 rounded-2xl border border-[#2a2f4a] bg-[#161927] space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Fundamental Analysis</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">{detail.summary}</p>
        </div>
        <div className="text-right shrink-0 ml-6">
          <div className="text-3xl font-bold text-white">{detail.final_score.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Pre-gauntlet: {detail.pre_gauntlet_score.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Gauntlet: {detail.gauntlet_total.toFixed(1)}</div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {detail.categories.map((cat) => (
          <CategorySection key={cat.name} category={cat} />
        ))}
      </div>

      {/* Gauntlet */}
      <GauntletSection items={detail.gauntlet_items} total={detail.gauntlet_total} />
    </div>
  );
}

function CategorySection({ category }: { category: FundamentalCategory }) {
  const [open, setOpen] = useState(false);
  const pct = (category.category_score / category.category_max) * 100;

  return (
    <div className="rounded-xl border border-[#2a2f4a] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1e2235] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="font-medium text-white text-sm">{category.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-32 bg-[#0d0f1a] rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-mono text-gray-300 w-16 text-right">
            {category.category_score.toFixed(0)} / {category.category_max}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#2a2f4a] divide-y divide-[#2a2f4a]">
          {category.items.map((item) => (
            <div key={item.name} className="px-4 py-3 bg-[#0d0f1a]/40">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2">
                  <ScoreIcon score={item.score} max={item.max_score} />
                  <span className="text-sm text-white">{item.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e2235] text-gray-400">
                    {item.rating}
                  </span>
                </div>
                <span className="text-sm font-mono text-gray-300 shrink-0">
                  {item.score} / {item.max_score}
                </span>
              </div>
              <p className="text-xs text-gray-400 ml-6">{item.explanation}</p>
              {item.evidence && (
                <p className="text-xs text-blue-400/70 ml-6 mt-1 italic">Evidence: {item.evidence}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GauntletSection({ items, total }: { items: GauntletItem[]; total: number }) {
  const [open, setOpen] = useState(false);
  const hasDeductions = items.some((i) => i.deduction < 0);

  return (
    <div className="rounded-xl border border-orange-800/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-orange-950/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-orange-400" /> : <ChevronRight className="w-4 h-4 text-orange-400" />}
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <span className="font-medium text-orange-300 text-sm">The Gauntlet</span>
          {hasDeductions && (
            <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full">
              Deductions active
            </span>
          )}
        </div>
        <span className="text-sm font-mono text-orange-400">{total.toFixed(0)} pts</span>
      </button>

      {open && (
        <div className="border-t border-orange-800/30 divide-y divide-[#2a2f4a]">
          {items.map((item) => (
            <div key={item.name} className={`px-4 py-3 ${item.deduction < 0 ? "bg-red-950/20" : "bg-[#0d0f1a]/20"}`}>
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2">
                  {item.deduction < 0
                    ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    : <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
                  <span className="text-sm text-white">{item.name}</span>
                </div>
                <span className={`text-sm font-mono shrink-0 ${item.deduction < 0 ? "text-red-400" : "text-gray-500"}`}>
                  {item.deduction === 0 ? "0" : item.deduction.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-gray-400 ml-6">{item.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreIcon({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />;
  if (pct >= 0.4) return <CheckCircle className="w-4 h-4 text-yellow-400 shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
}
