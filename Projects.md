# AI Portfolio Projects — Best Options for Each

---

## 3.1 RAG App (High Priority)

**Recommended: Local Food & Restaurant Discovery RAG**


| Why this stands out                                                                      |
| ---------------------------------------------------------------------------------------- |
| Southeast Asia food context is unique — no Western tutorial covers Grabfood/Foodpanda    |
| Semantic search beats keyword matching for food queries ("something spicy under RM15")   |
| Multi-source ingestion: menus, reviews, ratings, location — shows real data pipeline     |
| Hyperlocal angle is immediately relatable to any Malaysian/SEA interviewer               |
| Optional multi-modal extension: index menu photos alongside text                         |


**What it does:**

- Scrape and ingest restaurant/food data from Grabfood, Foodpanda, Google Maps, or Yelp for a target city (e.g. KL / PJ / Subang)
- Each document = one restaurant or dish: name, cuisine type, price range, rating, location, menu items, review snippets
- User asks in natural language: *"Best laksa under RM15 near Subang Jaya"* or *"Vegetarian-friendly dim sum in PJ with high ratings"*
- RAG retrieves relevant restaurant chunks → LLM synthesises a ranked recommendation with reasoning
- Optionally: user adds past dining history (liked/disliked) → personalised retrieval (hybrid dense + user preference filter)

**Flow:**

```
User query: "spicy noodle soup under RM12 near SS15"
        │
        ▼
┌─────────────────────┐
│  Query Embedding    │  Convert query to dense vector
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Vector Store       │  Chroma / Pinecone — cosine similarity search
│  (restaurant docs)  │  Filter: price ≤ RM12, location near SS15
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Top-K Chunks       │  e.g. 5 relevant restaurant/dish records
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  LLM (GPT-4 / Gemini│  Synthesise recommendation with names,
│  with RAG context)  │  prices, ratings, why each fits the query
└─────────────────────┘
```

**Data pipeline:**

1. **Scrape / collect** — Playwright scraper for Grabfood/Foodpanda menus + Google Maps Places API for ratings/reviews
2. **Chunk** — Each dish or restaurant = one document with structured metadata (price, cuisine, location coords, rating)
3. **Embed** — OpenAI `text-embedding-3-small` or sentence-transformers
4. **Store** — Chroma (local dev) or Pinecone (production)
5. **Hybrid search** — Dense vector similarity + metadata filter (price range, location radius, cuisine tag)
6. **LLM answer** — GPT-4 or Gemini synthesises top-K results into a natural language recommendation

**Key technical decisions to talk through in interviews:**

- **Why RAG over a normal database search?** Semantic queries like "comfort food for rainy day" can't be answered by SQL — embeddings capture meaning, not just keywords.
- **Chunking strategy** — restaurant-level vs dish-level chunks. Dish-level gives more precise price matching; restaurant-level gives better context for ambience/cuisine queries.
- **Hybrid search** — dense embeddings alone miss hard constraints (price ≤ RM15). Combine with Chroma metadata filters or a sparse BM25 pass for structured fields.
- **Freshness problem** — menus and prices change. Discuss re-ingestion schedule or change-detection on the source pages.
- **Multi-modal extension** — embed menu photos (CLIP) alongside text for queries like "show me places with nice ambience".

**Stack:** Python, LangChain or LlamaIndex, OpenAI embeddings (`text-embedding-3-small`), Chroma (local) / Pinecone (prod), GPT-4 or Gemini, Playwright for scraping, Google Maps Places API, Next.js or Streamlit frontend.

---

## 3.2 AI Agent Project

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

## 3.3 Practical LLM App — Smart Split as LLM Fintech Expenses App

**Current state (from codebase):**


| Feature                          | Status      | Location                                             |
| -------------------------------- | ----------- | ---------------------------------------------------- |
| Chatbot (receipt + text parsing) | Working     | `AIChatModal`, `parseExpense` Cloud Function, Gemini |
| Statistical charts               | Working     | Dashboard, `analytics.ts`                            |
| AI Weekly Insights               | Not working | `weeklyInsight.ts` (Pub/Sub Sunday 09:00 UTC)        |


**Why weekly insights likely fails:** Pub/Sub only runs when deployed; Vertex AI config; or no users with `aiInsightsEnabled=true`.

---

**Approach: 3 phases to become "LLM Fintech Expenses App"**

### Phase 1: Fix and unblock weekly insights

- Add a **callable** Cloud Function `generateInsightNow(userId)` so you can trigger insight generation manually (for testing and on-demand use).
- Verify Vertex AI: `GCLOUD_PROJECT`, service account permissions, Vertex AI API enabled.
- Add "Generate insight now" button on dashboard/insights page — users get insights without waiting for Sunday.
- Keep existing scheduled job for automatic weekly delivery.

### Phase 2: Add conversational expense Q&A

- Extend `AIChatModal` with a mode toggle: **Add expense** (existing) vs **Ask about expenses** (new).
- New flow: user asks "What did I spend on food last month?" → client or new Cloud Function fetches analytics (reuse `analytics.ts`: `getCategoryBreakdown`, `getPeriodSpending`, etc.) → pass structured summary to Gemini → return natural language answer.
- No RAG needed here — analytics are already structured. Pass JSON summary into the prompt.
- New callable: `askExpenseQuestion(userId, question, dateRange?)` — fetches expenses, computes aggregates, calls Gemini with context, returns answer.

### Phase 3: On-demand insights and recommendations

- "Analyze my spending" button — same logic as weekly insight but for any date range (e.g. last 30 days).
- "Suggest a budget" — Gemini receives category breakdown, suggests allocations.
- "Am I over budget?" — pass budget vs actual from `BudgetVsActual` into Gemini.
- Proactive alerts: "You're 40% over on dining this month" — can be shown in dashboard or via push later.

---

**Architecture (data flow):**

```
User question ("What did I spend on groceries?")
        │
        ▼
┌─────────────────────┐
│ Callable Function   │  askExpenseQuestion(userId, question)
│ or API route        │
└─────────┬───────────┘
          │
          ├──► Fetch expenses (Firestore)
          ├──► Compute analytics (reuse analytics.ts logic)
          ├──► Build prompt: "User data: {categories, totals, ...}. Question: ..."
          ├──► Call Gemini (Vertex AI)
          └──► Return natural language answer
```

---

**Files to add/modify:**


| File                                      | Change                                                     |
| ----------------------------------------- | ---------------------------------------------------------- |
| `functions/src/weeklyInsight.ts`          | Add `generateInsightNow` callable (manual trigger)         |
| `functions/src/`                          | New `askExpenseQuestion.ts` — callable for Q&A             |
| `src/components/AIChatModal.tsx`          | Add mode: Add expense vs Ask                               |
| `src/utils/aiAssistant.ts`                | Add `askExpenseQuestion()` client call                     |
| `app/insights/page.tsx` or `InsightsCard` | "Generate now" button                                      |
| Dashboard                                 | Optional: "Ask AI" quick input or link to chat in Ask mode |


---

**Stack:** Keep Gemini (Vertex AI) — already integrated. No new LLM provider needed.

---

## Summary Table


| Category  | Best Project                          | Differentiator                                                    |
| --------- | ------------------------------------- | ----------------------------------------------------------------- |
| RAG       | Local Food & Restaurant Discovery RAG | SEA food context; semantic search over menus + reviews; hyperlocal|
| Agent     | Price Comparison Agent (SEA)          | Shopee/Lazada/Carousell; multi-step fetch, parse, trust-score     |
| Practical | Smart Split as LLM Fintech App        | Fix insights; add Q&A; on-demand analysis                         |


---

## Suggested Order

1. **Smart Split as LLM Fintech** — Already live; fix insights; add Ask mode; on-demand analysis
2. **Local Food RAG** — Core RAG skills; Southeast Asia data pipeline; semantic food search
3. **Price Comparison Agent** — Completes the trio; agentic tool use; SEA platforms; trust scoring

---

## Project Todo List

### 1. Wrap up Smart Split

- 1.1 Implement Playwright tests
- 1.2 Run tests
- 1.3 Decide whether to publish on Apple/Google store

### 2. Make Together into a website

- 2.1 Get a domain and host it / publish on Apple or Google store
- 2.2 Run tests after deployment

