"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell,
} from "recharts";

interface StateData {
  state: string;
  avgMortality: number;
  count: number;
}

interface Props {
  data: StateData[];
  nationalAvg: number | null;
}

export default function StateBarChart({ data, nationalAvg }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleState = (state: string) => {
    setSelected((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const clearSelection = () => setSelected([]);

  const displayData =
    selected.length > 0
      ? data.filter((d) => selected.includes(d.state))
      : data;

  const formatted = displayData.map((d) => ({
    ...d,
    avgMortality: Math.round(d.avgMortality * 10) / 10,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-semibold text-gray-800">Mortality Comparison by State</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {nationalAvg !== null && `National avg: ${nationalAvg} · `}
            Click states below to compare side-by-side
          </p>
        </div>
        {selected.length > 0 && (
          <button
            onClick={clearSelection}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Show all
          </button>
        )}
      </div>

      {/* Multi-state picker */}
      <div className="flex flex-wrap gap-1.5 mb-4 max-h-24 overflow-y-auto">
        {data.map((d) => (
          <button
            key={d.state}
            onClick={() => toggleState(d.state)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              selected.includes(d.state)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-600 border-gray-200 hover:border-blue-400"
            }`}
          >
            {d.state}
          </button>
        ))}
      </div>

      {formatted.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="state"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val) => [`${val}`, "Avg Mortality"]}
            />
            {nationalAvg !== null && (
              <ReferenceLine
                y={nationalAvg}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{ value: `National avg: ${nationalAvg}`, position: "insideTopRight", fontSize: 11, fill: "#f59e0b" }}
              />
            )}
            <Bar dataKey="avgMortality" name="Avg Mortality Rate" radius={[4, 4, 0, 0]}>
              {formatted.map((entry) => (
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
