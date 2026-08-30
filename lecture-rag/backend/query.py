import os

import chromadb
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.vector_stores import MetadataFilter, MetadataFilters
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.chroma import ChromaVectorStore

CHROMA_PATH = os.getenv(
    "CHROMA_PATH",
    os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "LectureRAG", "chroma_db"),
)
COLLECTION_NAME = "lecture_notes"
EMBED_MODEL = "text-embedding-3-small"
LLM_MODEL = "gpt-4o"

SUMMARY_KEYWORDS = [
    "summarise", "summarize", "summary", "overview",
    "explain chapter", "what is chapter", "recap",
]


def detect_intent(query: str) -> str:
    q = query.lower()
    if any(kw in q for kw in SUMMARY_KEYWORDS):
        return "summary"
    return "concept"


def _get_index():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(COLLECTION_NAME)
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    embed_model = OpenAIEmbedding(model=EMBED_MODEL)
    return VectorStoreIndex.from_vector_store(
        vector_store, storage_context=storage_context, embed_model=embed_model
    )


def answer_query(question: str, course: str | None = None, chapter: str | None = None) -> dict:
    """
    Answer a natural language question using retrieved lecture content.
    - summary intent + chapter provided → filter by course+chapter, fetch all (k=20)
    - concept intent → filter by course only (or no filter), fetch top-K (k=8)
    """
    intent = detect_intent(question)
    index = _get_index()
    llm = OpenAI(model=LLM_MODEL)

    filters = []
    if course:
        filters.append(MetadataFilter(key="course", value=course))
    if intent == "summary" and chapter:
        filters.append(MetadataFilter(key="chapter", value=chapter))

    top_k = 20 if intent == "summary" else 8
    retriever_kwargs = {"similarity_top_k": top_k}
    if filters:
        retriever_kwargs["filters"] = MetadataFilters(filters=filters)

    retriever = index.as_retriever(**retriever_kwargs)
    query_engine = RetrieverQueryEngine.from_args(retriever=retriever, llm=llm)
    response = query_engine.query(question)

    sources = []
    for node in response.source_nodes:
        sources.append({
            "page": node.metadata.get("page_label", "?"),
            "chapter": node.metadata.get("chapter", ""),
            "score": round(node.score, 3) if node.score else None,
        })

    return {
        "answer": str(response),
        "intent": intent,
        "sources": sources,
    }
