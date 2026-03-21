"use client";

import { useState } from "react";
import type { AnalysisResponse } from "@/lib/types";

type SortKey = "state" | "avgMortality" | "count";

interface Props {
  byState: AnalysisResponse["byState"];
  nationalAvg: number | null;
}

export default function RankingTable({ byState, nationalAvg }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("avgMortality");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...byState].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === "string" && typeof vb === "string") {
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="ml-1 text-gray-300">↕</span>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Facility Ranking by State</h3>
        <p className="text-xs text-gray-400 mt-0.5">Click column headers to sort</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:text-gray-800"
                onClick={() => toggle("state")}
              >
                State <SortIcon col="state" />
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-800"
                onClick={() => toggle("avgMortality")}
              >
                Avg Mortality <SortIcon col="avgMortality" />
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-800"
                onClick={() => toggle("count")}
              >
                Facilities <SortIcon col="count" />
              </th>
              <th className="px-4 py-3 text-left">vs National Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row, i) => {
              const diff =
                nationalAvg !== null
                  ? Math.round((row.avgMortality - nationalAvg) * 10) / 10
                  : null;
              const above = diff !== null && diff > 0;
              return (
                <tr key={row.state} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.state}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {Math.round(row.avgMortality * 10) / 10}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{row.count}</td>
                  <td className="px-4 py-3">
                    {diff !== null ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          above
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {above ? "+" : ""}{diff}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
