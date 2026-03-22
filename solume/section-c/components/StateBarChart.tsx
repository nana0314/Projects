"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// Default 6 geographically & demographically representative states
const DEFAULT_STATES = ["CA", "TX", "NY", "FL", "GA", "IL"];

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
  // Seed with DEFAULT_STATES that actually exist in the dataset
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (data.length === 0) return;
    const available = data.map((d) => d.state);
    const defaults = DEFAULT_STATES.filter((s) => available.includes(s));
    // If some defaults are missing (e.g. filtered dataset), fall back to first 6
    setSelected(defaults.length >= 2 ? defaults : available.slice(0, 6));
  }, [data]);

  const toggleState = (state: string) => {
    setSelected((prev) =>
      prev.includes(state)
        ? prev.filter((s) => s !== state)
        : [...prev, state]
    );
  };

  const resetToDefault = () => {
    const available = data.map((d) => d.state);
    const defaults = DEFAULT_STATES.filter((s) => available.includes(s));
    setSelected(defaults.length >= 2 ? defaults : available.slice(0, 6));
  };

  // Chart only shows selected states, sorted by avgMortality desc
  const displayData = data
    .filter((d) => selected.includes(d.state))
    .sort((a, b) => b.avgMortality - a.avgMortality)
    .map((d) => ({ ...d, avgMortality: Math.round(d.avgMortality * 10) / 10 }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">Mortality Comparison by State</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {selected.length} state{selected.length !== 1 ? "s" : ""} selected — click to add or remove
          </p>
        </div>
        <button
          onClick={resetToDefault}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap ml-4"
        >
          Reset
        </button>
      </div>

      {nationalAvg !== null && (
        <div className="flex items-center gap-2 mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          <span className="inline-block w-6 border-t-2 border-dashed border-amber-500" />
          National average: <strong>{nationalAvg}</strong>
        </div>
      )}

      {/* State picker pills */}
      <div className="flex flex-wrap gap-1.5 mb-4 max-h-28 overflow-y-auto pr-1">
        {data.map((d) => {
          const isSelected = selected.includes(d.state);
          return (
            <button
              key={d.state}
              onClick={() => toggleState(d.state)}
              title={`Avg mortality: ${Math.round(d.avgMortality * 10) / 10} · ${d.count} facilities`}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-gray-100 text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {d.state}
            </button>
          );
        })}
      </div>

      {displayData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
          Select at least one state above
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={displayData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="state"
              tick={{ fontSize: 13, fontWeight: 500 }}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: "Avg Mortality", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af", dy: 45 }}
            />
            <Tooltip
              formatter={(val) => [`${val}`, "Avg Mortality Rate"]}
              labelFormatter={(l) => `State: ${l}`}
              contentStyle={{ fontSize: 13 }}
            />
            <Bar dataKey="avgMortality" name="Avg Mortality Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
