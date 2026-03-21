"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Filters from "@/components/Filters";
import SummaryCards from "@/components/SummaryCards";
import Top10Table from "@/components/Top10Table";
import DataTable from "@/components/DataTable";
import type { SummaryResponse, TableResponse } from "@/lib/types";

function SummaryPageContent() {
  const searchParams = useSearchParams();
  const filterString = searchParams.toString();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [table, setTable] = useState<TableResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  useEffect(() => {
    setLoadingSummary(true);
    fetch(`/api/summary?${filterString}`)
      .then((r) => r.json())
      .then((data) => { setSummary(data); setLoadingSummary(false); })
      .catch(() => setLoadingSummary(false));
  }, [filterString]);

  useEffect(() => {
    setLoadingTable(true);
    fetch(`/api/table?${filterString}`)
      .then((r) => r.json())
      .then((data) => { setTable(data); setLoadingTable(false); })
      .catch(() => setLoadingTable(false));
  }, [filterString]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Summary</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of dialysis facility mortality rates across the US
        </p>
      </div>

      <Filters />

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
      />
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense>
      <SummaryPageContent />
    </Suspense>
  );
}
