# University Lecture Notes RAG — Technical Reference

**Framework: LlamaIndex** — chosen for cleaner RAG pipelines, built-in metadata filtering, and less boilerplate than LangChain for this use case.

---

## Upload Flow

The user interacts with a Streamlit sidebar:

```
[ Upload PDF ] [ Course name: _______ ] [ Chapter: _______ ] [ Ingest ]
```

On submit, the file is sent to a **FastAPI backend**. The backend owns the entire ingestion pipeline — the frontend just ships the file + metadata.

---

## LlamaIndex RAG Pipeline

### Step 1 — Parse the PDF
```python
from llama_index.readers.file import PyMuPDFReader

reader = PyMuPDFReader()
documents = reader.load_data(file_path="lecture.pdf")
# Each document = one page, with metadata: { file_name, page_label }
```

### Step 2 — Chunk it
```python
from llama_index.core.node_parser import SentenceSplitter

splitter = SentenceSplitter(chunk_size=500, chunk_overlap=50)
nodes = splitter.get_nodes_from_documents(documents)

# Attach custom metadata to each node
for node in nodes:
    node.metadata.update({ "course": "Business Analytics", "chapter": "Chapter 1" })
```

### Step 3 — Embed + Store
```python
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
import chromadb

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("lecture_notes")
vector_store = ChromaVectorStore(chroma_collection=collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

embed_model = OpenAIEmbedding(model="text-embedding-3-small")
index = VectorStoreIndex(nodes, storage_context=storage_context, embed_model=embed_model)
```
LlamaIndex embeds every node and stores vectors + metadata in Chroma automatically.

### Step 4 — Query with Metadata Filters
```python
from llama_index.core.vector_stores import MetadataFilter, MetadataFilters

filters = MetadataFilters(filters=[
    MetadataFilter(key="course", value="Business Analytics"),
    MetadataFilter(key="chapter", value="Chapter 1"),
])
retriever = index.as_retriever(filters=filters, similarity_top_k=10)
```
- **Chapter summary** → filter by course + chapter, grab top 10 nodes
- **Concept query** → drop chapter filter, let cosine similarity find best nodes across all chapters

### Step 5 — LLM Answer with Citations
```python
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.llms.openai import OpenAI

llm = OpenAI(model="gpt-4o")
query_engine = RetrieverQueryEngine.from_args(retriever=retriever, llm=llm)
response = query_engine.query("Summarise Chapter 1")

# Source citations available via:
for node in response.source_nodes:
    print(node.metadata["page_label"], node.score)
```

---

## Quiz Session Flow

```python
from llama_index.core.vector_stores import MetadataFilter, MetadataFilters
from llama_index.llms.openai import OpenAI
import json

def generate_quiz(index, course: str, chapter: str, difficulty: str, num_questions: int = 5):
    # 1. Retrieve all chunks for the chapter
    filters = MetadataFilters(filters=[
        MetadataFilter(key="course", value=course),
        MetadataFilter(key="chapter", value=chapter),
    ])
    retriever = index.as_retriever(filters=filters, similarity_top_k=20)
    nodes = retriever.retrieve("lecture content")

    # 2. Build prompt
    content = "\n\n".join([n.text for n in nodes])
    prompt = f"""Based on the following lecture content, generate {num_questions} quiz questions.
Difficulty: {difficulty} (easy=direct recall, medium=application, hard=comparison/analysis)

Return ONLY valid JSON:
[{{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "explanation": "Based on page X: ..."
}}]

After generating each question, verify the correct answer is unambiguously supported by the text.

Content:
{content[:8000]}"""

    # 3. Call LLM, parse JSON
    llm = OpenAI(model="gpt-4o")
    response = llm.complete(prompt)
    return json.loads(response.text)
```

**Question types by difficulty:**
| Difficulty | Style |
|---|---|
| Easy | Direct recall — "What does OLAP stand for?" |
| Medium | Application — "Which scenario is OLAP better suited for?" |
| Hard | Comparison/analysis — "Why would you choose OLAP over OLTP for this use case?" |

---

## Intent Detection

```python
def detect_intent(query: str) -> str:
    summary_keywords = ["summarise", "summarize", "summary", "overview", "explain chapter", "what is chapter"]
    if any(kw in query.lower() for kw in summary_keywords):
        return "summary"
    return "concept"
```
- **summary** → retrieve ALL chunks for the chapter (completeness matters)
- **concept** → retrieve top-K across all chapters (precision matters)

---

## Full Request Lifecycle

```
User uploads PDF + tags
        │
        ▼
POST /ingest
        │
        ├── PyMuPDFReader parses PDF → pages/documents
        ├── SentenceSplitter → nodes (~500 tokens, 50 overlap)
        ├── Attach metadata (course, chapter, page)
        ├── OpenAI embeds each node (text-embedding-3-small)
        └── Chroma persists vectors + metadata

User asks a question
        │
        ▼
POST /query  { question, course?, chapter? }
        │
        ├── detect_intent() → summary | concept
        ├── Build MetadataFilters
        ├── Retrieve top-K nodes
        └── LLM answers with source citations

User starts a quiz
        │
        ▼
POST /quiz  { course, chapter, difficulty, num_questions }
        │
        ├── Retrieve all chapter nodes (k=20)
        ├── LLM generates structured JSON quiz
        └── Return [{question, options, answer, explanation}]
```

---

## Key Technical Decisions (for interviews)

- **Why RAG fits here** — data is private (your PDFs), static, and too large to stuff into one prompt
- **Chunking strategy** — SentenceSplitter (500 tokens, 50 overlap) balances context preservation and retrieval precision
- **Hybrid retrieval** — metadata filter first (narrows to right chapter), then cosine similarity within that subset
- **Intent detection** — summary retrieves ALL chapter nodes (completeness); concept retrieves top-K (precision); quiz retrieves all then prompts for structured JSON
- **Citation grounding** — `source_nodes` from LlamaIndex gives page + score; always surface these in the UI
- **Quiz self-verification** — prompt instructs LLM to verify each answer is unambiguously supported before returning
- **Scaling** — Chroma local is fine for one user; swap to Pinecone with user-scoped namespaces for multi-user
