"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  data: { era: string; avgMortality: number; count: number }[];
  nationalAvg: number | null;
}

// Shows how average mortality rate differs across facility certification eras.
// certification_date varies per facility and is the only real time dimension
// available in the CMS cross-sectional snapshot dataset.
export default function MortalityTrendChart({ data, nationalAvg }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Mortality Rate Trend by Facility Era</h3>
      <p className="text-xs text-gray-400 mb-4">
        Average mortality rate grouped by facility certification decade
      </p>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="era" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="mortality"
              domain={[15, 35]}
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => v}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              formatter={(val, name) => name === "Facility Count"
                ? [`${val}`, "Facility Count"]
                : [`${val}`, "Avg Mortality Rate"]}
              labelFormatter={(l) => `Era: ${l}`}
            />
            <Legend />
            <Line
              yAxisId="mortality"
              type="monotone"
              dataKey="avgMortality"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#3b82f6" }}
              name="Avg Mortality Rate"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="count"
              stroke="#d1d5db"
              strokeWidth={1.5}
              dot={false}
              name="Facility Count"
              strokeDasharray="3 3"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
