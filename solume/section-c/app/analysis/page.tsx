"use client";

import { useEffect, useState } from "react";
import Filters, { emptyFilters, type FilterValues } from "@/components/Filters";
import PageNav from "@/components/PageNav";
import MortalityTrendChart from "@/components/MortalityTrendChart";
import StateBarChart from "@/components/StateBarChart";
import ZipBarChart from "@/components/ZipBarChart";
import DistributionChart from "@/components/DistributionChart";
import RankingTable from "@/components/RankingTable";
import type { AnalysisResponse, SummaryResponse } from "@/lib/types";

export default function AnalysisPage() {
  const [filters, setFilters] = useState<FilterValues>(emptyFilters);

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const filterString = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""))
  ).toString();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/analysis${filterString ? `?${filterString}` : ""}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/summary${filterString ? `?${filterString}` : ""}`, { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([a, s]) => {
        setAnalysis(a);
        setSummary(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterString]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visual insights into dialysis facility mortality patterns
          </p>
        </div>
        <PageNav />
      </div>

      <Filters values={filters} onChange={setFilters} />

      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-80 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && analysis && (
        <>
          <MortalityTrendChart data={analysis.byCertEra} nationalAvg={analysis.nationalAvg} />

          <div className="grid md:grid-cols-2 gap-6">
            <StateBarChart data={analysis.byState} nationalAvg={analysis.nationalAvg} />
            <ZipBarChart data={analysis.byZip} nationalAvg={analysis.nationalAvg} />
          </div>

          <DistributionChart
            data={analysis.distribution}
            outlierThreshold={summary?.outlierThreshold ?? null}
          />

          <RankingTable
            byState={analysis.byState}
            nationalAvg={analysis.nationalAvg}
          />
        </>
      )}
    </div>
  );
}
