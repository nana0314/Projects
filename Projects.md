# AI Portfolio Projects — Best Options for Each

---

## 3.1 RAG App (High Priority)

**Recommended: University Lecture Notes RAG**


| Why this stands out                                                                         |
| ------------------------------------------------------------------------------------------- |
| Truly private data — your own PDFs, no public API can answer from them                     |
| Static by nature — RAG fits perfectly, no freshness problem                                 |
| Solves a real pain point you have right now (Masters program)                               |
| Chapter-level summary + cross-chapter Q&A shows hybrid retrieval skills                    |
| Demo is credible: use your actual course material live in an interview                      |


**What it does:**

- User uploads lecture PDFs and tags them with metadata (course name, chapter number) on ingest
- Chunks are stored with structured metadata: `{ source, course, chapter, page }`
- User asks in natural language:
  - *"Summarise Chapter 1 of Business Analytics"* → retrieves all Chapter 1 chunks → LLM writes summary
  - *"What is the difference between OLAP and OLTP?"* → cross-chapter semantic search → LLM answers with source citations
  - *"Give me 5 practice questions for Chapter 3"* → retrieves Chapter 3 content → LLM generates questions
  - *"Explain gradient descent in simpler terms"* → finds relevant chunks → LLM reformulates for clarity

**Flow:**

```
── INGEST (one-time per PDF) ──────────────────────────────────────────

PDF upload + user tags (course="Business Analytics", chapter="Chapter 1")
        │
        ▼
┌─────────────────────┐
│  PDF Parser         │  PyMuPDF — extract text, detect headings
│  (PyMuPDF)          │  Split into chunks (~500 tokens, 50 overlap)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Embed chunks       │  OpenAI text-embedding-3-small
│  + attach metadata  │  { source, course, chapter, page }
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Chroma vector store│  Persisted locally
└─────────────────────┘

── QUERY (every request) ──────────────────────────────────────────────

User: "Summarise Chapter 1 of Business Analytics"
        │
        ▼
┌─────────────────────┐
│  Intent detection   │  Is this a chapter summary or a concept query?
│  (simple classifier)│  Summary → filter by chapter first
└──────────┬──────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
Chapter filter  Semantic search
(metadata)      (dense vector)
     └─────┬──────┘
           ▼
┌─────────────────────┐
│  Top-K chunks       │  Ranked by relevance within filtered set
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  LLM (GPT-4/Gemini) │  Answer / summarise / generate questions
│  + source citations │  "Based on page 4 of Lecture 3..."
└─────────────────────┘
```

**Data pipeline:**

1. **Upload** — user drags in PDF + fills in course name + chapter tag (simple form)
2. **Parse** — PyMuPDF extracts text page by page; detect section headings for smarter chunking
3. **Chunk** — fixed-size (~500 tokens) with 50-token overlap; each chunk inherits file metadata
4. **Embed** — `text-embedding-3-small` (cheap, fast, good quality)
5. **Store** — Chroma persisted locally; each collection = one course
6. **Hybrid retrieval** — metadata filter (chapter, course) + cosine similarity within filtered set
7. **LLM answer** — GPT-4 or Gemini with retrieved chunks in context; always include source page citations

**Key technical decisions to talk through in interviews:**

- **Why RAG fits here perfectly** — data is private (your PDFs), static (lecture notes don't change), and large enough that stuffing everything into one prompt would exceed context limits and be expensive.
- **Chunking strategy** — fixed-size vs semantic chunking. Fixed-size is predictable; semantic (split on headings) preserves concept boundaries better for lecture slides. Trade-off: heading detection reliability.
- **Hybrid retrieval** — metadata filter first (narrows to the right chapter), then dense search within that subset. Pure semantic search alone would pull chunks from wrong chapters for summary queries.
- **Chapter summary vs concept query** — different retrieval strategies. Summary: retrieve ALL chunks for a chapter (completeness matters). Concept query: retrieve top-K most relevant (precision matters). Simple intent classifier handles this.
- **Citation grounding** — always return `source + page` with the answer. This makes the output verifiable and prevents hallucination from going unnoticed.
- **Scaling** — Chroma local is fine for one user's notes. For multi-user, swap to Pinecone with user-scoped namespaces.

**Stack:** Python, LangChain or LlamaIndex, PyMuPDF (PDF parsing), OpenAI `text-embedding-3-small`, Chroma (local) / Pinecone (prod), GPT-4 or Gemini, Next.js or Streamlit frontend for upload + chat UI.

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
| RAG       | University Lecture Notes RAG          | Private PDFs; chapter summary + cross-chapter Q&A; hybrid retrieval|
| Agent     | Price Comparison Agent (SEA)          | Shopee/Lazada/Carousell; multi-step fetch, parse, trust-score     |
| Practical | Smart Split as LLM Fintech App        | Fix insights; add Q&A; on-demand analysis                         |


---

## Suggested Order

1. **Smart Split as LLM Fintech** — Already live; fix insights; add Ask mode; on-demand analysis
2. **University Lecture Notes RAG** — Core RAG skills; private PDFs; chapter summary + concept Q&A
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

