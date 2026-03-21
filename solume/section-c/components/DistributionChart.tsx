"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  data: { bucket: string; min: number; max: number; count: number }[];
  outlierThreshold: number | null;
}

export default function DistributionChart({ data, outlierThreshold }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Mortality Rate Distribution</h3>
      <p className="text-xs text-gray-400 mb-4">
        Number of facilities per mortality rate bucket
        {outlierThreshold !== null && ` · Outlier threshold: >${outlierThreshold}`}
      </p>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val) => [`${val}`, "Facilities"]}
              labelFormatter={(l) => `Mortality: ${l}`}
            />
            <Bar dataKey="count" name="Facilities" radius={[4, 4, 0, 0]}>
              {data.map((entry) => {
                const isOutlierBucket =
                  outlierThreshold !== null && entry.min >= outlierThreshold;
                return (
                  <Cell
                    key={entry.bucket}
                    fill={isOutlierBucket ? "#ef4444" : "#10b981"}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {outlierThreshold !== null && (
        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500"></span>
          Red buckets = outlier zone (mortality &gt; {outlierThreshold})
        </p>
      )}
    </div>
  );
}
