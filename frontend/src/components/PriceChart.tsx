"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  historical: { date: string; close: number }[];
  ticker: string;
}

export default function PriceChart({ historical, ticker }: Props) {
  if (!historical || historical.length === 0) {
    return (
      <div className="h-full min-h-[200px] rounded-2xl border border-[#2a2f4a] bg-[#161927] flex items-center justify-center">
        <p className="text-gray-500 text-sm">No historical data</p>
      </div>
    );
  }

  const min = Math.min(...historical.map((d) => d.close)) * 0.97;
  const max = Math.max(...historical.map((d) => d.close)) * 1.03;
  const isPositive = historical[historical.length - 1].close >= historical[0].close;

  return (
    <div className="p-6 rounded-2xl border border-[#2a2f4a] bg-[#161927]">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">{ticker} — 1 Year Price</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={historical} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            width={55}
          />
          <Tooltip
            contentStyle={{ background: "#1e2235", border: "1px solid #2a2f4a", borderRadius: 8 }}
            labelStyle={{ color: "#9ca3af", fontSize: 11 }}
            itemStyle={{ color: "#e8eaf6", fontSize: 12 }}
            formatter={(v: number) => [`$${v.toFixed(2)}`, "Close"]}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
