import os
import tempfile
from pathlib import Path

import chromadb
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.readers.file import PyMuPDFReader
from llama_index.vector_stores.chroma import ChromaVectorStore

CHROMA_PATH = os.getenv(
    "CHROMA_PATH",
    os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "LectureRAG", "chroma_db"),
)
COLLECTION_NAME = "lecture_notes"
EMBED_MODEL = "text-embedding-3-small"


def get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    return client.get_or_create_collection(COLLECTION_NAME)


def get_index(collection):
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    embed_model = OpenAIEmbedding(model=EMBED_MODEL)
    return VectorStoreIndex.from_vector_store(
        vector_store, storage_context=storage_context, embed_model=embed_model
    )


def ingest_pdf(pdf_bytes: bytes, filename: str, course: str, chapter: str) -> dict:
    """Parse, chunk, embed and store a PDF with metadata."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        reader = PyMuPDFReader()
        documents = reader.load_data(file_path=tmp_path)

        splitter = SentenceSplitter(chunk_size=500, chunk_overlap=50)
        nodes = splitter.get_nodes_from_documents(documents)

        for node in nodes:
            node.metadata.update({
                "course": course,
                "chapter": chapter,
                "filename": filename,
            })
            # Exclude metadata keys from LLM context to keep prompts clean
            node.excluded_llm_metadata_keys = ["filename"]

        collection = get_chroma_collection()
        vector_store = ChromaVectorStore(chroma_collection=collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        embed_model = OpenAIEmbedding(model=EMBED_MODEL)

        VectorStoreIndex(nodes, storage_context=storage_context, embed_model=embed_model)

        return {
            "status": "ok",
            "filename": filename,
            "course": course,
            "chapter": chapter,
            "chunks": len(nodes),
        }
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def list_chapters() -> list[dict]:
    """Return all unique (course, chapter) pairs stored in Chroma."""
    collection = get_chroma_collection()
    results = collection.get(include=["metadatas"])
    seen = set()
    chapters = []
    for meta in results["metadatas"]:
        key = (meta.get("course", ""), meta.get("chapter", ""))
        if key not in seen:
            seen.add(key)
            chapters.append({"course": key[0], "chapter": key[1]})
    return sorted(chapters, key=lambda x: (x["course"], x["chapter"]))
