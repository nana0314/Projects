# AI Portfolio Projects — Best Options for Each

---

## 3.1 RAG App (High Priority)

**Recommended: Personal Knowledge Base**


| Why this stands out                                                       |
| ------------------------------------------------------------------------- |
| Cursor/Copilot already do codebase Q&A — a standalone version adds little |
| Your notes, bookmarks, and articles are private — no generic AI has them  |
| "What did I save about RAG?" → only your data can answer                  |
| Shows RAG over mixed sources (Markdown, PDFs, web clips)                  |


**What it does:**

- Ingest: notes (Obsidian/Notion export), saved articles, bookmarks
- User asks: "What have I learned about embeddings?"
- RAG retrieves from your personal corpus
- LLM answers with citations to your own sources

**Stack:** LangChain or LlamaIndex, OpenAI embeddings, Chroma, GPT-4

---

## 3.2 AI Agent Project

**Recommended: Academic Writing Agent — Section Type Writing + In-Text Citations**


| Why this                                                                              |
| ------------------------------------------------------------------------------------- |
| Clear use case: students/researchers need lit reviews and introductions               |
| Agent finds related papers online, writes section, cites properly                     |
| Shows multi-step reasoning: search papers → read/summarize → draft → insert citations |
| Output is verifiable (real papers, real citations)                                    |


**What it does:**

- User inputs: topic (e.g. "RAG for legal document analysis") + section type ("introduction" or "literature review")
- Agent: searches Semantic Scholar / Google Scholar / web for related papers → retrieves abstracts/key info → drafts the section with in-text citations (Author, Year) and a references list
- Output: ready-to-use introduction with proper citations and bibliography

**Flow:**

1. User: topic + "write me an introduction with in-text citations"
2. Agent: search for papers → filter relevant ones → extract key claims
3. Agent: draft introduction, insert (Author, Year) where claims are supported
4. Output: Markdown or formatted text with references list at end

**Stack:** LangChain agents, Semantic Scholar API (free) or Serper for paper search, GPT-4. Optional: Zotero-style reference formatting.

**Tools the agent uses:** Paper search API, web fetch (for abstracts), LLM for writing.

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


| Category  | Best Project                                       | Differentiator                                 |
| --------- | -------------------------------------------------- | ---------------------------------------------- |
| RAG       | Personal knowledge base                            | Your private data; no generic AI can replicate |
| Agent     | Academic writing agent (intro + in-text citations) | Finds papers, drafts section, cites properly   |
| Practical | Smart Split as LLM Fintech App                     | Fix insights; add Q&A; on-demand analysis      |


---

## Suggested Order

1. **RAG (Personal knowledge base)** — Core RAG skills; unique because it uses your data
2. **Smart Split as LLM Fintech** — Fix weekly insights; add Ask mode to chat; on-demand analysis
3. **Academic Writing Agent** — Completes the trio (RAG, agent, practical)

---

## Project Todo List

### 1. Wrap up Smart Split

- 1.1 Implement Playwright tests
- 1.2 Run tests
- 1.3 Decide whether to publish on Apple/Google store

### 2. Make Together into a website

- 2.1 Get a domain and host it / publish on Apple or Google store
- 2.2 Run tests after deployment

