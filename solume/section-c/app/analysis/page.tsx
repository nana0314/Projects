"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Filters from "@/components/Filters";
import MortalityTrendChart from "@/components/MortalityTrendChart";
import StateBarChart from "@/components/StateBarChart";
import ZipBarChart from "@/components/ZipBarChart";
import DistributionChart from "@/components/DistributionChart";
import RankingTable from "@/components/RankingTable";
import type { AnalysisResponse, SummaryResponse } from "@/lib/types";

function AnalysisPageContent() {
  const searchParams = useSearchParams();
  const filterString = searchParams.toString();

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/analysis?${filterString}`).then((r) => r.json()),
      fetch(`/api/summary?${filterString}`).then((r) => r.json()),
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visual insights into dialysis facility mortality patterns
        </p>
      </div>

      <Filters />

      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-80 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && analysis && (
        <>
          <MortalityTrendChart data={analysis.byState} nationalAvg={analysis.nationalAvg} />

          <div className="grid md:grid-cols-2 gap-6">
            <StateBarChart data={analysis.byState} nationalAvg={analysis.nationalAvg} />
            <ZipBarChart data={analysis.byZip} />
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

export default function AnalysisPage() {
  return (
    <Suspense>
      <AnalysisPageContent />
    </Suspense>
  );
}
