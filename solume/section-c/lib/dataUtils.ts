import type { Facility, FilterParams, FacilityRow } from "./types";

export function filterFacilities(
  facilities: Facility[],
  params: FilterParams
): Facility[] {
  // Year and month filters are based on each facility's certification_date
  // (format: "YYYY-MM-DD"), which ranges from 1968 to 2025 and varies per facility.
  // This is the only date field that differs between records and allows meaningful filtering.
  return facilities.filter((f) => {
    if (params.year  && f._cert_year  !== parseInt(params.year,  10)) return false;
    if (params.month && f._cert_month !== parseInt(params.month, 10)) return false;
    if (params.state && f.state.toUpperCase() !== params.state.toUpperCase()) return false;
    if (params.zip && !f.zip_code.startsWith(params.zip)) return false;
    if (params.name && !f.facility_name.toLowerCase().includes(params.name.toLowerCase())) return false;
    return true;
  });
}

export function toFacilityRow(f: Facility, outlierThreshold?: number | null): FacilityRow {
  const mortality = f._mortality;
  return {
    ccn: f.cms_certification_number_ccn,
    name: f.facility_name,
    state: f.state,
    zip: f.zip_code,
    city: f.citytown,
    mortality,
    upperCI: f.mortality_rate_upper_confidence_limit_975.trim()
      ? parseFloat(f.mortality_rate_upper_confidence_limit_975)
      : null,
    lowerCI: f.mortality_rate_lower_confidence_limit_25.trim()
      ? parseFloat(f.mortality_rate_lower_confidence_limit_25)
      : null,
    period: f.smr_date,
    isOutlier:
      outlierThreshold != null && mortality != null
        ? mortality > outlierThreshold
        : false,
  };
}

export function computeStats(facilities: Facility[]) {
  const values = facilities
    .map((f) => f._mortality)
    .filter((v): v is number => v !== null);

  if (values.length === 0) {
    return { avg: null, min: null, max: null, stdDev: null, outlierThreshold: null };
  }

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const outlierThreshold = avg + 2 * stdDev;

  return { avg, min, max, stdDev, outlierThreshold };
}

export function getDistributionBuckets(facilities: Facility[]) {
  const buckets = [
    { min: 0, max: 5 },
    { min: 5, max: 10 },
    { min: 10, max: 20 },
    { min: 20, max: 30 },
    { min: 30, max: 50 },
    { min: 50, max: Infinity },
  ];

  return buckets.map((b) => ({
    bucket: b.max === Infinity ? `${b.min}+` : `${b.min}–${b.max}`,
    min: b.min,
    max: b.max,
    count: facilities.filter(
      (f) => f._mortality !== null && f._mortality >= b.min && f._mortality < b.max
    ).length,
  }));
}

export function groupByState(facilities: Facility[]) {
  const map = new Map<string, number[]>();
  for (const f of facilities) {
    if (f._mortality === null || !f.state) continue;
    if (!map.has(f.state)) map.set(f.state, []);
    map.get(f.state)!.push(f._mortality);
  }
  return Array.from(map.entries())
    .map(([state, vals]) => ({
      state,
      avgMortality: vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    }))
    .sort((a, b) => b.avgMortality - a.avgMortality);
}

export function groupByZip(facilities: Facility[], topN = 20) {
  const map = new Map<string, number[]>();
  for (const f of facilities) {
    if (f._mortality === null || !f.zip_code) continue;
    if (!map.has(f.zip_code)) map.set(f.zip_code, []);
    map.get(f.zip_code)!.push(f._mortality);
  }
  return Array.from(map.entries())
    .map(([zip, vals]) => ({
      zip,
      avgMortality: vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    }))
    .sort((a, b) => b.avgMortality - a.avgMortality)
    .slice(0, topN);
}

// Groups facilities by certification era (decade brackets) to show how
// facility vintage correlates with mortality — a real time-based dimension in the data.
export function groupByCertEra(facilities: Facility[]) {
  const brackets: { label: string; min: number; max: number }[] = [
    { label: "Before 1980", min: 0,    max: 1979 },
    { label: "1980s",        min: 1980, max: 1989 },
    { label: "1990s",        min: 1990, max: 1999 },
    { label: "2000s",        min: 2000, max: 2009 },
    { label: "2010–2014",    min: 2010, max: 2014 },
    { label: "2015–2019",    min: 2015, max: 2019 },
    { label: "2020+",        min: 2020, max: 9999 },
  ];

  return brackets
    .map((b) => {
      const vals = facilities
        .filter((f) => f._cert_year !== null && f._cert_year >= b.min && f._cert_year <= b.max && f._mortality !== null)
        .map((f) => f._mortality as number);
      return {
        era: b.label,
        avgMortality: vals.length > 0 ? Math.round((vals.reduce((a, c) => a + c, 0) / vals.length) * 10) / 10 : 0,
        count: vals.length,
      };
    })
    .filter((b) => b.count > 0);
}

export function groupByMonth(facilities: Facility[]) {
  const map = new Map<number, number[]>();
  for (const f of facilities) {
    if (f._mortality === null || f._month === null) continue;
    if (!map.has(f._month)) map.set(f._month, []);
    map.get(f._month)!.push(f._mortality);
  }
  return Array.from(map.entries())
    .map(([month, vals]) => ({
      month,
      avgMortality: vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    }))
    .sort((a, b) => a.month - b.month);
}
