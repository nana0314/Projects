# Solume Coding Review — Zi Song Yeoh

Submission for the Solume Medical coding assessment (deadline: 27 March 2026, 9:00 Sydney time).

## Structure

| Folder | Section | Description |
|--------|---------|-------------|
| `section-a/` | Section A (Q A, B, C) | BMW Global Sales data analysis — Power BI (.pbix) |
| `section-b/` | Section B (Q D) | Tree LCA kawaiiness algorithm — Python |
| `section-c/` | Section C (Q E) | CMS Dialysis Mortality full-stack app — Next.js + Vercel |

## Section A — Data Analysis (Power BI)

Open `section-a/bmw_analysis.pbix` in Power BI Desktop.

The file contains 4 pages:
- **Page 0 – Data Quality**: flags 9 negative BEV_Share rows and 288 pre-launch i4/iX rows found in the dataset.
- **Page 1 – Question A**: BEV_Share electrification trend and correlation with Units_Sold and Revenue_EUR by region (2018–2025).
- **Page 2 – Question B**: Price elasticity by model across GDP growth conditions.
- **Page 3 – Question C**: Seasonal patterns in Revenue_EUR and Units_Sold and their interaction with GDP_Growth and Fuel_Price_Index.

## Section B — Algorithm (Python)

See `section-b/README.md` for run instructions.

**Quick start:**
```bash
cd section-b
python solution.py < input.txt
```

## Section C — Full-Stack Application (Next.js)

**Live URL:** https://section-c-xi.vercel.app

**Run locally:**
```bash
cd section-c
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables required — data is fetched from the public CMS API.

See `section-c/README.md` for full details and architectural decisions.
