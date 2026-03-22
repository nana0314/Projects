"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DC","DE","FL","GA","GU","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","MP","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","PR","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

// The CMS dataset covers a single aggregate period: 01Jan2021–31Dec2024.
// Selecting a year within 2021-2024 returns all data (every facility falls in that window).
// Years outside that range return zero results, which is correct behaviour.
const SMR_YEARS = ["2021", "2022", "2023", "2024"];

export default function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push("?" + params.toString());
    },
    [router, searchParams]
  );

  const clear = () => router.push("?");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h2>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium">
            SMR period: Jan 2021 – Dec 2024
          </span>
        </div>
        <button
          onClick={clear}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Reporting Year
          </label>
          <select
            value={searchParams.get("year") ?? ""}
            onChange={(e) => setParam("year", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All years (2021–2024)</option>
            {SMR_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select
            value={searchParams.get("state") ?? ""}
            onChange={(e) => setParam("state", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">ZIP Code</label>
          <input
            type="text"
            placeholder="e.g. 902"
            value={searchParams.get("zip") ?? ""}
            onChange={(e) => setParam("zip", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Facility Name</label>
          <input
            type="text"
            placeholder="Search name..."
            value={searchParams.get("name") ?? ""}
            onChange={(e) => setParam("name", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
