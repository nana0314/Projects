"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

interface Props {
  data: { state: string; avgMortality: number; count: number }[];
  nationalAvg: number | null;
}

export default function TopStatesMortalityChart({ data, nationalAvg }: Props) {
  const top15 = [...data]
    .sort((a, b) => b.avgMortality - a.avgMortality)
    .slice(0, 15)
    .map((d) => ({
      ...d,
      avgMortality: Math.round(d.avgMortality * 10) / 10,
    }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Top 15 States by Avg Mortality Rate</h3>
      <p className="text-xs text-gray-400 mb-4">
        Highest average mortality rates across states — red bars exceed the national average
        {nationalAvg !== null ? ` (${nationalAvg})` : ""}
      </p>
      {top15.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={top15} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, "auto"]} />
            <YAxis type="category" dataKey="state" tick={{ fontSize: 12 }} width={32} />
            <Tooltip
              formatter={(val) => [`${val}`, "Avg Mortality"]}
              labelFormatter={(l) => `State: ${l}`}
            />
            {nationalAvg !== null && (
              <ReferenceLine x={nationalAvg} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Nat. Avg", fontSize: 11, fill: "#b45309" }} />
            )}
            <Bar dataKey="avgMortality" name="Avg Mortality Rate" radius={[0, 4, 4, 0]}>
              {top15.map((entry) => (
                <Cell
                  key={entry.state}
                  fill={nationalAvg !== null && entry.avgMortality > nationalAvg ? "#ef4444" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
