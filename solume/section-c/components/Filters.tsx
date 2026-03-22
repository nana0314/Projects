"use client";

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

export interface FilterValues {
  year: string;
  month: string;
  state: string;
  zip: string;
  name: string;
}

interface Props {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}

export function emptyFilters(): FilterValues {
  return { year: "", month: "", state: "", zip: "", name: "" };
}

export default function Filters({ values, onChange }: Props) {
  const set = (key: keyof FilterValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const clear = () => onChange(emptyFilters());

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h2>
        <button onClick={clear} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

        <div>
          <label className="block text-xs text-gray-500 mb-1">Year</label>
          <select
            value={values.year}
            onChange={(e) => set("year", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All years</option>
            {CERT_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Month</label>
          <select
            value={values.month}
            onChange={(e) => set("month", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All months</option>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select
            value={values.state}
            onChange={(e) => set("state", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All states</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">ZIP Code</label>
          <input
            type="text"
            placeholder="e.g. 902"
            value={values.zip}
            onChange={(e) => set("zip", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Facility Name</label>
          <input
            type="text"
            placeholder="Search name..."
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

      </div>
    </div>
  );
}
