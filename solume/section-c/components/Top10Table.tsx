import type { FacilityRow } from "@/lib/types";

interface Props {
  highest: FacilityRow[];
  lowest: FacilityRow[];
}

function MiniTable({ rows, variant }: { rows: FacilityRow[]; variant: "high" | "low" }) {
  const color = variant === "high" ? "text-red-600" : "text-green-600";
  const bg = variant === "high" ? "bg-red-50" : "bg-green-50";
  const title = variant === "high" ? "Top 10 Highest Mortality" : "Top 10 Lowest Mortality";

  return (
    <div className={`rounded-xl border border-gray-200 overflow-hidden shadow-sm`}>
      <div className={`${bg} px-4 py-3 border-b border-gray-200`}>
        <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Facility</th>
              <th className="px-4 py-2 text-left">State</th>
              <th className="px-4 py-2 text-right">Mortality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={r.ccn} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium text-gray-800 max-w-xs truncate">{r.name}</td>
                <td className="px-4 py-2 text-gray-500">{r.state}</td>
                <td className={`px-4 py-2 text-right font-semibold ${color}`}>
                  {r.mortality !== null ? r.mortality : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Top10Table({ highest, lowest }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <MiniTable rows={highest} variant="high" />
      <MiniTable rows={lowest} variant="low" />
    </div>
  );
}
