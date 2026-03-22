"use client";

import type { FacilityRow, TableResponse } from "@/lib/types";

interface Props {
  data: TableResponse | null;
  loading: boolean;
  filterString: string;
  onPageChange: (page: number) => void;
}

function exportCSV(filterString: string) {
  fetch(`/api/table?${filterString}&pageSize=9999`)
    .then((r) => r.json())
    .then((json: TableResponse) => {
      const headers = ["CCN", "Facility Name", "State", "ZIP", "City", "Mortality Rate", "Lower CI", "Upper CI", "Period"];
      const rows = json.data.map((r) => [
        r.ccn, `"${r.name.replace(/"/g, '""')}"`, r.state, r.zip, r.city,
        r.mortality ?? "", r.lowerCI ?? "", r.upperCI ?? "", r.period,
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const suffix = filterString ? `_${filterString.replace(/[=&]/g, "_")}` : "";
      a.href = url;
      a.download = `mortality${suffix}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
}

export default function DataTable({ data, loading, filterString, onPageChange }: Props) {
  const currentPage = data?.page ?? 1;
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  const goToPage = (p: number) => onPageChange(p);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">All Facilities</h3>
          {data && (
            <p className="text-xs text-gray-500 mt-0.5">
              {data.total.toLocaleString()} results · page {currentPage} of {totalPages}
            </p>
          )}
        </div>
        <button
          onClick={() => exportCSV(filterString)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Facility</th>
              <th className="px-4 py-3 text-left">State</th>
              <th className="px-4 py-3 text-left">ZIP</th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-right">Mortality</th>
              <th className="px-4 py-3 text-right">CI (2.5–97.5%)</th>
              <th className="px-4 py-3 text-left">Period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Loading...</td>
              </tr>
            )}
            {!loading && (!data || data.data.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No results found.</td>
              </tr>
            )}
            {!loading &&
              data?.data.map((row: FacilityRow) => (
                <tr key={row.ccn} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{row.name}</span>
                      {row.isOutlier && (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Outlier
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.state}</td>
                  <td className="px-4 py-3 text-gray-600">{row.zip}</td>
                  <td className="px-4 py-3 text-gray-600">{row.city}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {row.mortality !== null ? row.mortality : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {row.lowerCI !== null && row.upperCI !== null
                      ? `${row.lowerCI} – ${row.upperCI}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.period}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
