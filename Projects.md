# AI Portfolio Projects — Best Options for Each

---

## 3.1 AI Agent Project

**Recommended: Price Comparison Agent (Southeast Asia)**


| Why this stands out                                                                         |
| ------------------------------------------------------------------------------------------- |
| Southeast Asia context (Shopee, Lazada) — no Western tutorial uses these         |
| Agentic steps are obvious and verifiable: search → fetch → parse → compare → recommend      |
| Output is instantly checkable — user can open the link and verify the price                 |
| Shows real tool use: web search, page fetch, HTML parsing, LLM reasoning                    |
| Handles adversarial data: fake reviews, inflated original prices, suspiciously cheap sellers |


**What it does:**

- User inputs a product name and optional budget (e.g. *"Sony WH-1000XM5 headphones, under RM1200"*)
- Agent searches Shopee, Lazada, and Carousell for listings
- Fetches individual listing pages, extracts: price, seller rating, number of sales, shipping cost, return policy
- Flags suspicious deals (price >> market average, new seller with zero reviews, no returns)
- Ranks listings and returns a recommendation with reasoning: *"Best value: Shopee seller X — RM999, 4.9★, 2k+ sold, free returns"*

**Flow:**

```
User: "Sony WH-1000XM5 under RM1200"
        │
        ▼
┌─────────────────────────────┐
│ Tool: Web Search            │  Search "Sony WH-1000XM5 Shopee Lazada Carousell"
│ (Serper / Brave Search API) │  Returns top listing URLs per platform
└──────────────┬──────────────┘
               │ (parallel fetches)
       ┌───────┼───────┐
       ▼       ▼       ▼
  Shopee   Lazada  Carousell
  listing  listing  listing
  pages    pages    pages
       └───────┬───────┘
               ▼
┌─────────────────────────────┐
│ Tool: Web Fetch + Parser    │  Extract: price, rating, sold count,
│ (Playwright / BeautifulSoup)│  shipping, seller age, return policy
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ Tool: Price Sanity Check    │  Flag if price < 40% of median (likely scam)
│ (in-code heuristic)         │  Flag if seller < 10 sales and new account
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ LLM (GPT-4 / Gemini)        │  Rank and explain: best value, safest seller,
│ with structured data context│  budget pick, premium pick
└─────────────────────────────┘
```

**Agent tools:**

| Tool | Purpose |
|---|---|
| `web_search(query)` | Find listing URLs across platforms via Serper API |
| `fetch_page(url)` | Scrape listing page, extract structured data |
| `parse_listing(html)` | Extract price, rating, seller info, reviews |
| `flag_suspicious(listing)` | Heuristic checks for scam indicators |
| `compare_and_rank(listings)` | Score by value = price + trust + shipping |

**Key technical decisions to talk through in interviews:**

- **Why an agent vs a scraper?** A fixed scraper breaks when the site changes; the agent can reason about what it finds and adapt. Also handles ambiguous queries ("something similar but cheaper").
- **Parallelism** — fetching Shopee, Lazada, Carousell simultaneously with `asyncio` vs sequential. Trade-off: speed vs rate limiting / IP bans.
- **Anti-scraping** — Playwright with headless browser handles JS-rendered pages; rotating user agents; respect `robots.txt`. Discuss ethical scraping boundaries.
- **Trust scoring** — how to weight: price (40%), seller rating (30%), sales volume (20%), return policy (10%). Justify the weights.
- **LLM role** — LLM doesn't do the math; structured data does. LLM only writes the natural language summary. This avoids hallucinated prices.

**Stack:** Python, LangChain agents (or custom tool-call loop with OpenAI function calling), Playwright for JS-rendered pages, BeautifulSoup for parsing, Serper API for search, GPT-4 or Gemini, FastAPI backend, Next.js or Streamlit frontend.

---

## Summary Table


| Category | Best Project                 | Differentiator                                                      |
| -------- | ---------------------------- | ------------------------------------------------------------------- |
| Agent    | Price Comparison Agent (SEA) | Shopee/Lazada/Carousell; multi-step fetch, parse, trust-score       |


---

## Suggested Order

1. **Price Comparison Agent** — Agentic tool use; SEA platforms; trust scoring
