"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Props {
  data: { zip: string; avgMortality: number; count: number }[];
}

export default function ZipBarChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    avgMortality: Math.round(d.avgMortality * 10) / 10,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Mortality Comparison by ZIP Code</h3>
      <p className="text-xs text-gray-400 mb-4">Top 20 ZIP codes by average mortality rate</p>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatted} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="zip"
              tick={{ fontSize: 10 }}
              width={55}
            />
            <Tooltip
              formatter={(val) => [`${val}`, "Avg Mortality"]}
            />
            <Bar dataKey="avgMortality" fill="#8b5cf6" name="Avg Mortality Rate" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
