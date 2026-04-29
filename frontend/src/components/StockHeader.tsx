import { formatMarketCap, formatPrice, type MarketData } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StockHeader({ market }: { market: MarketData }) {
  const chg = market.price_change_pct;
  const isPos = chg !== null && chg > 0;
  const isNeg = chg !== null && chg < 0;

  return (
    <div className="h-full p-6 rounded-2xl border border-[#2a2f4a] bg-[#161927]">
      <div className="mb-4">
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">{market.ticker}</p>
        <h2 className="text-xl font-bold text-white leading-tight">{market.name}</h2>
      </div>

      <div className="flex items-end gap-3 mb-6">
        <span className="text-4xl font-bold text-white">{formatPrice(market.price)}</span>
        {chg !== null && (
          <span className={`flex items-center gap-1 text-sm font-medium pb-1 ${isPos ? "text-green-400" : isNeg ? "text-red-400" : "text-gray-400"}`}>
            {isPos ? <TrendingUp className="w-4 h-4" /> : isNeg ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            {isPos ? "+" : ""}{(chg * 100).toFixed(1)}% (52W)
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label="Market Cap" value={formatMarketCap(market.market_cap)} />
        <Stat label="P/E Ratio" value={market.pe_ratio ? market.pe_ratio.toFixed(1) : "N/A"} />
        <Stat label="52W High" value={formatPrice(market.week_52_high)} />
        <Stat label="52W Low" value={formatPrice(market.week_52_low)} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1e2235] rounded-xl p-3">
      <dt className="text-xs text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}
