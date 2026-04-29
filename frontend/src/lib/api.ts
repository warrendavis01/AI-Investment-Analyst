export interface MarketData {
  ticker: string;
  name: string;
  price: number | null;
  market_cap: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  pe_ratio: number | null;
  price_change_pct: number | null;
  historical: { date: string; close: number; volume?: number }[];
}

export interface FundamentalItem {
  name: string;
  score: number;
  max_score: number;
  rating: string;
  explanation: string;
  evidence: string;
}

export interface FundamentalCategory {
  name: string;
  items: FundamentalItem[];
  category_score: number;
  category_max: number;
}

export interface GauntletItem {
  name: string;
  deduction: number;
  min_deduction: number;
  explanation: string;
}

export interface FundamentalDetail {
  categories: FundamentalCategory[];
  pre_gauntlet_score: number;
  gauntlet_items: GauntletItem[];
  gauntlet_total: number;
  final_score: number;
  rating: string;
  summary: string;
}

export interface AntifragileItem {
  name: string;
  score: number;
  min_score: number;
  max_score: number;
  explanation: string;
}

export interface AntifragilePillar {
  name: string;
  items: AntifragileItem[];
  pillar_score: number;
}

export interface AntifragileDetail {
  pillars: AntifragilePillar[];
  total_score: number;
  rating: string;
  summary: string;
}

export interface Theme {
  theme: string;
  sentiment: number;
  importance: number;
  novelty: number;
  theme_score: number;
  quote?: string;
}

export interface Headline {
  headline: string;
  url: string | null;
}

export interface Source {
  category: string;
  label: string;
  url: string;
  description: string;
}

export interface SentimentDetail {
  score: number;
  rating: string;
  news_sentiment: number;
  transcript_sentiment: number;
  narrative_change_score: number;
  current_themes: Theme[];
  previous_themes: Theme[];
  new_themes: string[];
  removed_themes: string[];
  positive_themes: string[];
  negative_themes: string[];
  key_headlines: (Headline | string)[];
  summary: string;
}

export interface AnalysisResult {
  ticker: string;
  market_data: MarketData;
  fundamental: FundamentalDetail;
  antifragile: AntifragileDetail;
  sentiment: SentimentDetail;
  sources?: Source[];
  analysis_id: number;
  cached: boolean;
  created_at?: string;
}

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export async function runAnalysis(ticker: string): Promise<AnalysisResult> {
  const res = await fetch(`${BACKEND}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: ticker.toUpperCase() }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = `HTTP ${res.status}`;
    try {
      const err = JSON.parse(text);
      detail = err.detail || detail;
    } catch {
      if (text) detail = text.slice(0, 200);
    }
    throw new Error(detail);
  }

  return res.json();
}

export interface HistoryEntry {
  id: number;
  ticker: string;
  fundamental_score: number;
  antifragile_score: number;
  sentiment_score: number;
  fundamental_rating: string;
  antifragile_rating: string;
  sentiment_rating: string;
  company_name: string;
  created_at: string;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${BACKEND}/api/history`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAnalysisById(id: number): Promise<AnalysisResult> {
  const res = await fetch(`${BACKEND}/api/history/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function formatMarketCap(val: number | null): string {
  if (val === null || val === undefined) return "N/A";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

export function formatPrice(val: number | null): string {
  if (val === null || val === undefined) return "N/A";
  return `$${val.toFixed(2)}`;
}
