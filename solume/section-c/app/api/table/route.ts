import { NextRequest, NextResponse } from "next/server";
import { getAllFacilities } from "@/lib/cmsData";
import { filterFacilities, computeStats, toFacilityRow } from "@/lib/dataUtils";
import type { TableResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const params = {
    year: searchParams.get("year") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    zip: searchParams.get("zip") ?? undefined,
    name: searchParams.get("name") ?? undefined,
  };
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const rawPageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  // Allow pageSize=9999 (or any large value) for CSV export; cap normal paging at 500.
  const pageSize = rawPageSize >= 9999
    ? 9999
    : Math.min(500, Math.max(1, rawPageSize));

  const all = await getAllFacilities();
  const filtered = filterFacilities(all, params);
  const { outlierThreshold } = computeStats(filtered);

  // Sort by mortality descending (nulls last)
  const sorted = [...filtered].sort((a, b) => {
    if (a._mortality === null && b._mortality === null) return 0;
    if (a._mortality === null) return 1;
    if (b._mortality === null) return -1;
    return b._mortality - a._mortality;
  });

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const slice = sorted.slice(start, start + pageSize);

  const response: TableResponse = {
    data: slice.map((f) => toFacilityRow(f, outlierThreshold)),
    page,
    pageSize,
    total,
  };

  return NextResponse.json(response);
}
