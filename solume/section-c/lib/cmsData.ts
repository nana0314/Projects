import type { Facility } from "./types";

const CMS_API =
  "https://data.cms.gov/provider-data/api/1/datastore/query/23ew-n7w9/0";
const PAGE_SIZE = 1000;

// Month name → number map for parsing smr_date like "01Jan2021-31Dec2024"
const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function parseSMRDate(smr: string): { year: number | null; month: number | null } {
  if (!smr) return { year: null, month: null };
  // Format: "01Jan2021-31Dec2024" — take the start date
  const match = smr.match(/^(\d{2})([A-Za-z]{3})(\d{4})/);
  if (!match) return { year: null, month: null };
  const year = parseInt(match[3], 10);
  const month = MONTH_MAP[match[2].toLowerCase()] ?? null;
  return { year, month };
}

// Module-level in-memory cache — persists across requests within the same server instance.
// Refreshed after 1 hour to pick up CMS data updates.
let cachedFacilities: Facility[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getAllFacilities(): Promise<Facility[]> {
  const now = Date.now();
  if (cachedFacilities && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedFacilities;
  }

  const all: Facility[] = [];
  let offset = 0;

  while (true) {
    const url = `${CMS_API}?limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const json = await res.json();
    const results: Record<string, string>[] = json.results ?? [];
    if (results.length === 0) break;

    for (const r of results) {
      const { year, month } = parseSMRDate(r.smr_date ?? "");
      const mortStr = r.mortality_rate_facility?.trim();
      const mortalityRaw = mortStr && mortStr !== "" ? parseFloat(mortStr) : null;
      const mortality = mortalityRaw !== null && !isNaN(mortalityRaw) ? mortalityRaw : null;

      const certDate = r.certification_date ?? "";
      const certYear = certDate ? parseInt(certDate.slice(0, 4), 10) : null;

      all.push({
        facility_name: r.facility_name ?? "",
        state: r.state ?? "",
        zip_code: r.zip_code ?? "",
        smr_date: r.smr_date ?? "",
        mortality_rate_facility: r.mortality_rate_facility ?? "",
        mortality_rate_upper_confidence_limit_975: r.mortality_rate_upper_confidence_limit_975 ?? "",
        mortality_rate_lower_confidence_limit_25: r.mortality_rate_lower_confidence_limit_25 ?? "",
        citytown: r.citytown ?? "",
        cms_certification_number_ccn: r.cms_certification_number_ccn ?? "",
        certification_date: certDate,
        _year: year,
        _month: month,
        _mortality: mortality,
        _cert_year: certYear && !isNaN(certYear) ? certYear : null,
      });
    }

    if (results.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  cachedFacilities = all;
  cacheTimestamp = now;
  return all;
}
