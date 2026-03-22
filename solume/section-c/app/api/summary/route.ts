import { NextRequest, NextResponse } from "next/server";
import { getAllFacilities } from "@/lib/cmsData";
import { filterFacilities, computeStats, toFacilityRow } from "@/lib/dataUtils";
import type { SummaryResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const params = {
    year:  searchParams.get("year")  ?? undefined,
    month: searchParams.get("month") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    zip: searchParams.get("zip") ?? undefined,
    name: searchParams.get("name") ?? undefined,
  };

  const all = await getAllFacilities();
  const filtered = filterFacilities(all, params);
  const { avg, min, max, stdDev, outlierThreshold } = computeStats(filtered);

  const withMortality = filtered.filter((f) => f._mortality !== null);
  const sorted = [...withMortality].sort(
    (a, b) => (b._mortality ?? 0) - (a._mortality ?? 0)
  );

  const top10Highest = sorted.slice(0, 10).map((f) => toFacilityRow(f, outlierThreshold));
  const top10Lowest = sorted
    .slice(-10)
    .reverse()
    .map((f) => toFacilityRow(f, outlierThreshold));

  const response: SummaryResponse = {
    total: filtered.length,
    avgMortality: avg !== null ? Math.round(avg * 100) / 100 : null,
    minMortality: min !== null ? Math.round(min * 100) / 100 : null,
    maxMortality: max !== null ? Math.round(max * 100) / 100 : null,
    stdDev: stdDev !== null ? Math.round(stdDev * 100) / 100 : null,
    outlierThreshold: outlierThreshold !== null ? Math.round(outlierThreshold * 100) / 100 : null,
    top10Highest,
    top10Lowest,
  };

  return NextResponse.json(response);
}
