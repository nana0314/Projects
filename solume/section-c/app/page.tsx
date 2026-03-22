"use client";

import { useEffect, useState } from "react";
import Filters, { emptyFilters, type FilterValues } from "@/components/Filters";
import PageNav from "@/components/PageNav";
import SummaryCards from "@/components/SummaryCards";
import Top10Table from "@/components/Top10Table";
import DataTable from "@/components/DataTable";
import type { SummaryResponse, TableResponse } from "@/lib/types";

export default function SummaryPage() {
  const [filters, setFilters] = useState<FilterValues>(emptyFilters);
  const [page, setPage] = useState(1);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [table, setTable] = useState<TableResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const filterString = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""))
  ).toString();

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoadingSummary(true);
    fetch(`/api/summary${filterString ? `?${filterString}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { setSummary(data); setLoadingSummary(false); })
      .catch((err) => { if (err.name !== "AbortError") setLoadingSummary(false); });
    return () => controller.abort();
  }, [filterString]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingTable(true);
    const qs = new URLSearchParams(filterString ? filterString : undefined);
    qs.set("page", String(page));
    fetch(`/api/table?${qs.toString()}`, { cache: "no-store", signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { setTable(data); setLoadingTable(false); })
      .catch((err) => { if (err.name !== "AbortError") setLoadingTable(false); });
    return () => controller.abort();
  }, [filterString, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Summary</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of dialysis facility mortality rates across the US
          </p>
        </div>
        <PageNav />
      </div>

      <Filters values={filters} onChange={handleFiltersChange} />

      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <SummaryCards
          total={summary.total}
          avgMortality={summary.avgMortality}
          minMortality={summary.minMortality}
          maxMortality={summary.maxMortality}
        />
      ) : null}

      {!loadingSummary && summary && (
        <Top10Table highest={summary.top10Highest} lowest={summary.top10Lowest} />
      )}

      <DataTable
        data={table}
        loading={loadingTable}
        filterString={filterString}
        onPageChange={setPage}
      />
    </div>
  );
}
