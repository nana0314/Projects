import { NextRequest, NextResponse } from "next/server";
import { getAllFacilities } from "@/lib/cmsData";
import {
  filterFacilities,
  groupByMonth,
  groupByState,
  groupByZip,
  getDistributionBuckets,
  computeStats,
} from "@/lib/dataUtils";
import type { AnalysisResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const params = {
    state: searchParams.get("state") ?? undefined,
    zip: searchParams.get("zip") ?? undefined,
    name: searchParams.get("name") ?? undefined,
  };

  const all = await getAllFacilities();
  const filtered = filterFacilities(all, params);
  const { avg: nationalAvg } = computeStats(all); // national avg always uses full dataset

  const response: AnalysisResponse = {
    monthlyTrend: groupByMonth(filtered),
    byState: groupByState(filtered),
    byZip: groupByZip(filtered, 20),
    distribution: getDistributionBuckets(filtered),
    nationalAvg: nationalAvg !== null ? Math.round(nationalAvg * 100) / 100 : null,
  };

  return NextResponse.json(response);
}
