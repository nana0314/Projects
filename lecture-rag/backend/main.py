import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ingest import ingest_pdf, list_chapters
from query import answer_query
from quiz import generate_quiz

app = FastAPI(title="Lecture RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Ingest ────────────────────────────────────────────────────────────────────

@app.post("/ingest")
async def ingest(
    file: UploadFile = File(...),
    course: str = Form(...),
    chapter: str = Form(...),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    pdf_bytes = await file.read()
    try:
        result = ingest_pdf(pdf_bytes, file.filename, course, chapter)
        return result
    except Exception as e:
        import traceback, logging
        logging.error("ingest_pdf failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@app.get("/chapters")
def get_chapters():
    return list_chapters()


# ── Query ─────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str
    course: str | None = None
    chapter: str | None = None


@app.post("/query")
def query(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        return answer_query(req.question, req.course, req.chapter)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Quiz ──────────────────────────────────────────────────────────────────────

class QuizRequest(BaseModel):
    course: str
    chapter: str
    difficulty: str = "medium"
    num_questions: int = 5


@app.post("/quiz")
def quiz(req: QuizRequest):
    if req.difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(status_code=400, detail="difficulty must be easy, medium, or hard.")
    if not 1 <= req.num_questions <= 10:
        raise HTTPException(status_code=400, detail="num_questions must be between 1 and 10.")
    try:
        questions = generate_quiz(req.course, req.chapter, req.difficulty, req.num_questions)
        return {"questions": questions}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}
