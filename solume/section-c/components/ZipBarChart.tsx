"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

interface ZipData {
  zip: string;
  avgMortality: number;
  count: number;
}

interface Props {
  data: ZipData[];
  nationalAvg?: number | null;
}

const DEFAULT_COUNT = 6;

export default function ZipBarChart({ data, nationalAvg }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  // Seed with the top 6 ZIP codes by mortality whenever data changes
  useEffect(() => {
    if (data.length === 0) return;
    const top = data.slice(0, DEFAULT_COUNT).map((d) => d.zip);
    setSelected(top);
  }, [data]);

  const toggleZip = (zip: string) => {
    setSelected((prev) =>
      prev.includes(zip) ? prev.filter((z) => z !== zip) : [...prev, zip]
    );
  };

  const resetToDefault = () => {
    const top = data.slice(0, DEFAULT_COUNT).map((d) => d.zip);
    setSelected(top);
  };

  const displayData = data
    .filter((d) => selected.includes(d.zip))
    .sort((a, b) => b.avgMortality - a.avgMortality)
    .map((d) => ({ ...d, avgMortality: Math.round(d.avgMortality * 10) / 10 }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">Mortality Comparison by ZIP Code</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {selected.length} ZIP code{selected.length !== 1 ? "s" : ""} selected — click to add or remove
          </p>
        </div>
        <button
          onClick={resetToDefault}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap ml-4"
        >
          Reset
        </button>
      </div>

      {/* ZIP picker pills */}
      <div className="flex flex-wrap gap-1.5 mb-4 max-h-28 overflow-y-auto pr-1">
        {data.map((d) => {
          const isSelected = selected.includes(d.zip);
          return (
            <button
              key={d.zip}
              onClick={() => toggleZip(d.zip)}
              title={`Avg mortality: ${Math.round(d.avgMortality * 10) / 10} · ${d.count} facilities`}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                isSelected
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-gray-100 text-gray-500 border-gray-200 hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              {d.zip}
            </button>
          );
        })}
      </div>

      {displayData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
          Select at least one ZIP code above
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={displayData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, "auto"]} />
            <YAxis type="category" dataKey="zip" tick={{ fontSize: 12, fontWeight: 500 }} width={55} />
            <Tooltip
              formatter={(val) => [`${val}`, "Avg Mortality Rate"]}
              labelFormatter={(l) => `ZIP: ${l}`}
              contentStyle={{ fontSize: 13 }}
            />
            {nationalAvg != null && (
              <ReferenceLine
                x={nationalAvg}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{ value: `Nat. avg: ${nationalAvg}`, fontSize: 11, fill: "#b45309" }}
              />
            )}
            <Bar dataKey="avgMortality" fill="#8b5cf6" name="Avg Mortality Rate" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
