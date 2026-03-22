"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// certification_date in the CMS dataset ranges from 1968 to 2025.
// Year/month filters match each facility's individual certification date.
const CERT_YEARS: string[] = [];
for (let y = 2025; y >= 1968; y--) CERT_YEARS.push(String(y));

const MONTHS = [
  { value: "1",  label: "January" },  { value: "2",  label: "February" },
  { value: "3",  label: "March" },    { value: "4",  label: "April" },
  { value: "5",  label: "May" },      { value: "6",  label: "June" },
  { value: "7",  label: "July" },     { value: "8",  label: "August" },
  { value: "9",  label: "September" },{ value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DC","DE","FL","GA","GU","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","MP","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","PR","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) { params.set(key, value); } else { params.delete(key); }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clear = () => router.push(pathname);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h2>
          <span
            title="Year and Month filter by facility certification date (1968–2025). State, ZIP and Name filter the facility directly."
            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium cursor-help"
          >
            SMR period: Jan 2021 – Dec 2024
          </span>
        </div>
        <button onClick={clear} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* Year — based on certification_date year */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Year
            <span className="ml-1 text-gray-300 cursor-help" title="Filters by facility certification year (1968–2025)">ⓘ</span>
          </label>
          <select
            value={searchParams.get("year") ?? ""}
            onChange={(e) => setParam("year", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All years</option>
            {CERT_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Month — based on certification_date month */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Month
            <span className="ml-1 text-gray-300 cursor-help" title="Filters by facility certification month">ⓘ</span>
          </label>
          <select
            value={searchParams.get("month") ?? ""}
            onChange={(e) => setParam("month", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All months</option>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select
            value={searchParams.get("state") ?? ""}
            onChange={(e) => setParam("state", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All states</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* ZIP Code */}
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

        {/* Facility Name */}
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
