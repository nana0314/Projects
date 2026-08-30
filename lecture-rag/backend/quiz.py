import json
import os

import chromadb
from llama_index.core import StorageContext, VectorStoreIndex
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

DIFFICULTY_GUIDE = {
    "easy": "Direct recall questions. Example: 'What does OLAP stand for?'",
    "medium": "Application questions. Example: 'Which scenario is OLAP better suited for?'",
    "hard": "Comparison and analysis questions. Example: 'Why would you choose OLAP over OLTP for this use case?'",
}


def generate_quiz(course: str, chapter: str, difficulty: str, num_questions: int = 5) -> list[dict]:
    """
    Retrieve all chunks for a chapter and generate a structured quiz.
    Returns a list of { question, options, answer, explanation }.
    """
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(COLLECTION_NAME)
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    embed_model = OpenAIEmbedding(model=EMBED_MODEL)
    index = VectorStoreIndex.from_vector_store(
        vector_store, storage_context=storage_context, embed_model=embed_model
    )

    filters = MetadataFilters(filters=[
        MetadataFilter(key="course", value=course),
        MetadataFilter(key="chapter", value=chapter),
    ])
    retriever = index.as_retriever(filters=filters, similarity_top_k=20)
    nodes = retriever.retrieve("lecture content overview")

    if not nodes:
        raise ValueError(f"No content found for course='{course}', chapter='{chapter}'")

    content = "\n\n".join([n.text for n in nodes])
    difficulty_guide = DIFFICULTY_GUIDE.get(difficulty, DIFFICULTY_GUIDE["medium"])

    prompt = f"""You are a quiz generator for university lecture notes.

Based on the lecture content below, generate exactly {num_questions} multiple choice questions.
Difficulty: {difficulty} — {difficulty_guide}

Rules:
1. Each question must have exactly 4 options labelled A, B, C, D.
2. The correct answer must be unambiguously supported by the provided text.
3. The explanation must cite the source (e.g. "Based on page 3: ...").
4. Return ONLY valid JSON — no markdown, no extra text.

JSON format:
[
  {{
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "Based on page X: ..."
  }}
]

Lecture content:
{content[:8000]}"""

    llm = OpenAI(model=LLM_MODEL)
    response = llm.complete(prompt)
    raw = response.text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    questions = json.loads(raw)
    return questions
