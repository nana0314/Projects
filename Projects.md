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
- User can launch a **mini quiz session** per chapter:
  - Retrieves all chunks for the selected chapter → LLM generates MCQ/true-false/short answer questions
  - User picks difficulty (easy/medium/hard) before starting
  - Answers are checked, explanations shown after each question with source page citations
  - LLM self-verifies each answer is unambiguously supported by the retrieved text before returning

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

## Summary Table


| Category | Best Project                 | Differentiator                                                      |
| -------- | ---------------------------- | ------------------------------------------------------------------- |
| RAG      | University Lecture Notes RAG | Private PDFs; chapter summary + cross-chapter Q&A; hybrid retrieval |
| Agent    | Price Comparison Agent (SEA) | Shopee/Lazada/Carousell; multi-step fetch, parse, trust-score       |


---

## Suggested Order

1. **University Lecture Notes RAG** — Core RAG skills; private PDFs; chapter summary + concept Q&A
2. **Price Comparison Agent** — Agentic tool use; SEA platforms; trust scoring
