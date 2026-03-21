"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface Props {
  data: { month: number; avgMortality: number; count: number }[];
}

export default function MortalityTrendChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    monthName: MONTH_NAMES[d.month - 1] ?? `M${d.month}`,
    avgMortality: Math.round(d.avgMortality * 10) / 10,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Mortality Rate Trend by Month</h3>
      <p className="text-xs text-gray-400 mb-4">Average mortality rate across all facilities per measurement start month</p>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="monthName" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val) => [`${val}`, "Avg Mortality"]}
              labelFormatter={(l) => `Month: ${l}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgMortality"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Avg Mortality Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
