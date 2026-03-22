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
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="era" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
            <Tooltip
              formatter={(val, name) => name === "count"
                ? [`${val} facilities`, "Facilities"]
                : [`${val}`, "Avg Mortality"]}
              labelFormatter={(l) => `Era: ${l}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgMortality"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#3b82f6" }}
              name="Avg Mortality Rate"
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#d1d5db"
              strokeWidth={1.5}
              dot={false}
              name="Facility Count"
              yAxisId={0}
              strokeDasharray="3 3"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
