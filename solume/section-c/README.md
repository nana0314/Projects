# Section C — CMS Dialysis Facility Mortality Analysis

**Live URL:** https://section-c-xi.vercel.app

A full-stack web application for analysing dialysis facility mortality rates using publicly available CMS data.

---

## Run Locally

No environment variables required — all data is fetched from the public CMS API.

```bash
cd section-c
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Pages

### Page 1 — Summary (`/`)
- **Filters**: Year, Month, State, ZIP code (prefix match), Facility Name (search)
- **Stats**: Total facilities, average / min / max mortality rate
- **Top 10 Highest & Lowest** mortality facilities in the filtered set
- **Full paginated table** — 20 rows per page, sorted by mortality descending
  - Facilities above mean + 2×std dev are flagged with a red **Outlier** badge
- **Export CSV** — downloads all filtered results as a CSV file

### Page 2 — Analysis (`/analysis`)
- **Monthly trend** — line chart of average mortality by measurement start month
- **State comparison** — bar chart with national average reference line; bars above national avg are red
- **Multi-state side-by-side** — click state badges to select specific states for comparison
- **ZIP code comparison** — horizontal bar chart of top 20 ZIP codes by avg mortality
- **Distribution histogram** — facility counts per mortality bucket; outlier buckets highlighted red
- **Facility ranking table** — sortable by state, avg mortality, facility count; shows diff vs national avg

---

## API Endpoints

All endpoints accept query params: `?year=&month=&state=&zip=&name=`

| Endpoint | Returns |
|---|---|
| `GET /api/summary` | `{ total, avgMortality, minMortality, maxMortality, stdDev, outlierThreshold, top10Highest, top10Lowest }` |
| `GET /api/table?page=1&pageSize=20` | `{ data[], page, pageSize, total }` |
| `GET /api/analysis` | `{ monthlyTrend[], byState[], byZip[], distribution[], nationalAvg }` |

---

## Architectural Decisions

**No database.** The CMS dataset has 7,557 facilities — small enough to fetch via the public REST API and hold in memory. Using `next/cache` (`unstable_cache`) with a 1-hour revalidation means the CMS API is called at most once per hour per server instance, not on every request.

**Next.js API routes as backend.** No separate Express or FastAPI server is needed. API routes co-locate with the frontend in the same codebase and deploy as serverless functions on Vercel automatically.

**URL search params for filter state.** All filters are stored in the URL (`?year=2024&state=CA`), not in React state. This makes filter combinations shareable as links, supports browser back/forward, and removes the need for a submit button — filter changes immediately trigger a re-fetch.

**Recharts over D3.** Recharts provides composable React components for all chart types needed (line, bar, histogram) with good defaults. D3 would offer more flexibility but at significantly higher implementation cost for no additional value here.

---

## Data Notes

- `mortality_rate_facility` is a Standardised Mortality Ratio (SMR) value — empty strings are treated as null and excluded from all aggregations.
- `smr_date` (e.g. `"01Jan2021-31Dec2024"`) is parsed to extract the start year and month for filtering.
- ZIP filter uses prefix matching (e.g. `902` matches `90210`, `90211`, etc.).
- Outlier threshold = mean + 2×standard deviation of the filtered set.
