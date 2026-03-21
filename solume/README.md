# Solume Coding Review — Zi Song Yeoh

Submission for the Solume Medical coding assessment (deadline: 27 March 2026, 9:00 Sydney time).

## Structure

| Folder | Section | Description |
|--------|---------|-------------|
| `section-a/` | Section A (Q A, B, C) | BMW Global Sales data analysis — Power BI (.pbix) |
| `section-b/` | Section B (Q D) | Tree LCA kawaiiness algorithm — Python |
| `section-c/` | Section C (Q E) | CMS Dialysis Mortality full-stack app — Next.js + Vercel |

---

## Section A — Data Analysis (Power BI)

Open `section-a/bmw_analysis.pbix` in Power BI Desktop.

The file contains 4 pages:

- **Page 0 – Data Quality**: flags 9 negative BEV_Share rows and 288 pre-launch i4/iX rows found in the dataset.
- **Page 1 – Question A**: BEV_Share electrification trend and correlation with Units_Sold and Revenue_EUR by region (2018–2025).
- **Page 2 – Question B**: Price elasticity by model across GDP growth conditions.
- **Page 3 – Question C**: Seasonal patterns in Revenue_EUR and Units_Sold and their interaction with GDP_Growth and Fuel_Price_Index.

---

## Section B — Algorithm (Python)

### Problem

Given a tree with `n` nodes and integer `k`, compute the **kawaiiness** — the sum over all possible roots `r` of `f(r)`, where `f(r)` is the number of distinct nodes that can appear as the Lowest Common Ancestor (LCA) of some set of `k` nodes when the tree is rooted at `r`.

### How to Run

```bash
cd section-b
python solution.py < input.txt
```

Or with inline input:

```bash
echo "1
6 3
1 2
1 3
2 4
2 5
3 6" | python solution.py
# Expected output: 17
```

**Requirements:** Python 3.7+, no external libraries.

### Algorithm

**Key insight:** For a fixed root `r`, a node `v` can be the LCA of some `k`-node subset if and only if its subtree size (when rooted at `r`) is ≥ `k`. Proof: include `v` itself in the set plus any `k−1` descendants — the LCA is always `v`.

So: `f(r) = |{v : subtree_size_r(v) >= k}|`

**Rerooting in O(n):** Root the tree at node 1. For each node `v` with subtree size `sub[v]`, count roots `r` where `subtree_size_r(v) >= k`:

| Root `r` location | subtree_size_r(v) | Count | Contributes if |
|---|---|---|---|
| Outside `sub[v]` | `sub[v]` | `n − sub[v]` | `sub[v] >= k` |
| `r = v` | `n` | `1` | always |
| Inside child `c` of `v` | `n − sub[c]` | `sub[c]` | `n − sub[c] >= k` |

**Total per node v:** `[sub[v]>=k]*(n−sub[v]) + 1 + Σ_children_c [n−sub[c]>=k]*sub[c]`

**Time complexity:** O(n) per test case. Uses iterative DFS to avoid Python's recursion limit.

### Verified Examples

| Input | Expected | Got |
|---|---|---|
| n=2, k=2 | 2 | ✓ 2 |
| n=5, k=3 (star) | 9 | ✓ 9 |
| n=6, k=3 | 17 | ✓ 17 |
| n=10, k=5 | 35 | — (edges not shown in PDF) |

---

## Section C — Full-Stack Application (Next.js)

**Live URL:** https://section-c-xi.vercel.app

A full-stack web application for analysing dialysis facility mortality rates using publicly available CMS data.

### Run Locally

No environment variables required — all data is fetched from the public CMS API.

```bash
cd section-c
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Pages

**Page 1 — Summary (`/`)**
- **Filters**: Year, Month, State, ZIP code (prefix match), Facility Name (search)
- **Stats**: Total facilities, average / min / max mortality rate
- **Top 10 Highest & Lowest** mortality facilities in the filtered set
- **Full paginated table** — 20 rows per page, sorted by mortality descending; facilities above mean + 2×std dev flagged with a red **Outlier** badge
- **Export CSV** — downloads all filtered results as a CSV file

**Page 2 — Analysis (`/analysis`)**
- **Monthly trend** — line chart of average mortality by measurement start month
- **State comparison** — bar chart with national average reference line; bars above national avg are red
- **Multi-state side-by-side** — click state badges to compare specific states
- **ZIP code comparison** — horizontal bar chart of top 20 ZIP codes by avg mortality
- **Distribution histogram** — facility counts per mortality bucket; outlier buckets highlighted red
- **Facility ranking table** — sortable by state, avg mortality, facility count; shows diff vs national avg

### API Endpoints

All endpoints accept query params: `?year=&month=&state=&zip=&name=`

| Endpoint | Returns |
|---|---|
| `GET /api/summary` | `{ total, avgMortality, minMortality, maxMortality, stdDev, outlierThreshold, top10Highest, top10Lowest }` |
| `GET /api/table?page=1&pageSize=20` | `{ data[], page, pageSize, total }` |
| `GET /api/analysis` | `{ monthlyTrend[], byState[], byZip[], distribution[], nationalAvg }` |

### Architectural Decisions

**No database.** The CMS dataset has 7,557 facilities — small enough to fetch via the public REST API and hold in memory. `unstable_cache` with 1-hour revalidation means the CMS API is called at most once per hour, not on every request.

**Next.js API routes as backend.** No separate server needed — API routes deploy as serverless functions on Vercel automatically alongside the frontend.

**URL search params for filter state.** All filters are stored in the URL (`?year=2024&state=CA`), making combinations shareable, supporting browser back/forward, and removing the need for a submit button.

**Recharts over D3.** Composable React chart components with good defaults — no extra complexity needed for the charts required here.

### Data Notes

- `mortality_rate_facility` is a Standardised Mortality Ratio (SMR) — empty strings treated as null and excluded from aggregations.
- `smr_date` (e.g. `"01Jan2021-31Dec2024"`) is parsed to extract the start year and month for filtering.
- ZIP filter uses prefix matching (e.g. `902` matches `90210`, `90211`, etc.).
- Outlier threshold = mean + 2×standard deviation of the filtered set.
