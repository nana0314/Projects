import os
import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000")

st.set_page_config(page_title="Lecture RAG", page_icon="📚", layout="wide")

# ── Global styles ─────────────────────────────────────────────────────────────

st.markdown("""
<style>
/* Overall background */
[data-testid="stAppViewContainer"] { background: #0f1117; }
[data-testid="stSidebar"] { background: #1a1d27; border-right: 1px solid #2a2d3e; }

/* Hide default header */
[data-testid="stHeader"] { background: transparent; }

/* Tab styling */
[data-testid="stTabs"] button {
    font-size: 15px;
    font-weight: 600;
    color: #8b8fa8;
}
[data-testid="stTabs"] button[aria-selected="true"] {
    color: #7c6aff;
    border-bottom: 2px solid #7c6aff;
}

/* Source expander */
details summary { color: #8b8fa8; font-size: 12px; }

/* Quiz card */
.quiz-card {
    background: #1a1d27;
    border: 1px solid #2a2d3e;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 16px;
}
.quiz-correct { border-left: 4px solid #22c55e; }
.quiz-wrong   { border-left: 4px solid #ef4444; }

/* Score banner */
.score-banner {
    background: linear-gradient(135deg, #7c6aff22, #06b6d422);
    border: 1px solid #7c6aff44;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    margin-bottom: 24px;
}
</style>
""", unsafe_allow_html=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def api(method: str, path: str, **kwargs):
    try:
        resp = getattr(requests, method)(f"{API_URL}{path}", **kwargs)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to backend. Make sure the app is fully started.")
        return None
    except requests.exceptions.HTTPError as e:
        try:
            detail = e.response.json().get("detail", str(e))
        except Exception:
            detail = e.response.text or str(e)
        st.error(f"Error: {detail}")
        return None
    except requests.exceptions.JSONDecodeError:
        st.error("Backend returned an unexpected response. Check that the backend started correctly.")
        return None


@st.cache_data(ttl=10)
def fetch_chapters():
    data = api("get", "/chapters")
    return data or []


# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("## 📚 Lecture RAG")
    st.markdown("---")
    st.markdown("#### Upload Lecture PDF")

    uploaded_file = st.file_uploader("", type=["pdf"], label_visibility="collapsed")
    course_input = st.text_input("Course", placeholder="e.g. Business Analytics")
    chapter_input = st.text_input("Chapter", placeholder="e.g. Chapter 1")

    ingest_btn = st.button("Ingest PDF", type="primary", use_container_width=True,
                           disabled=not uploaded_file)
    if ingest_btn:
        if not course_input.strip() or not chapter_input.strip():
            st.warning("Fill in course and chapter first.")
        else:
            with st.spinner("Parsing and embedding..."):
                result = api(
                    "post", "/ingest",
                    files={"file": (uploaded_file.name, uploaded_file.getvalue(), "application/pdf")},
                    data={"course": course_input.strip(), "chapter": chapter_input.strip()},
                )
            if result:
                st.success(f"Done — {result['chunks']} chunks stored.")
                fetch_chapters.clear()

    st.markdown("---")

    chapters = fetch_chapters()
    if chapters:
        st.markdown("#### Ingested Chapters")
        grouped: dict[str, list[str]] = {}
        for c in chapters:
            grouped.setdefault(c["course"], []).append(c["chapter"])
        for course, chaps in sorted(grouped.items()):
            st.markdown(f"**{course}**")
            for ch in sorted(chaps):
                st.caption(f"  • {ch}")
    else:
        st.caption("No chapters ingested yet.")


# ── Main area ─────────────────────────────────────────────────────────────────

course_options = sorted({c["course"] for c in chapters}) if chapters else []

tab_chat, tab_quiz = st.tabs(["💬  Chat", "🧠  Quiz"])


# ── Chat tab ──────────────────────────────────────────────────────────────────

with tab_chat:
    st.markdown("### Ask about your lecture notes")

    if not chapters:
        st.info("Upload a lecture PDF from the sidebar to get started.")
    else:
        col1, col2, col3 = st.columns([2, 2, 1])
        with col1:
            selected_course = st.selectbox("Course", ["All courses"] + course_options,
                                           key="chat_course", label_visibility="visible")
        with col2:
            chapter_options_for_course = ["All chapters"] + sorted(
                c["chapter"] for c in chapters
                if selected_course == "All courses" or c["course"] == selected_course
            )
            selected_chapter = st.selectbox("Chapter", chapter_options_for_course,
                                            key="chat_chapter")
        with col3:
            if st.button("Clear chat", use_container_width=True):
                st.session_state.messages = []
                st.rerun()

        st.markdown("")

        if "messages" not in st.session_state:
            st.session_state.messages = []

        # Render history
        for msg in st.session_state.messages:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])
                if msg.get("sources"):
                    with st.expander(f"📄 {len(msg['sources'])} source(s)"):
                        for s in msg["sources"]:
                            score = f"· relevance {s['score']}" if s.get("score") else ""
                            st.caption(f"Page {s['page']} · {s['chapter']} {score}")

        # Input
        question = st.chat_input("Ask a question, request a summary, or generate practice questions...")
        if question:
            st.session_state.messages.append({"role": "user", "content": question})
            with st.chat_message("user"):
                st.markdown(question)

            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    result = api("post", "/query", json={
                        "question": question,
                        "course": None if selected_course == "All courses" else selected_course,
                        "chapter": None if selected_chapter == "All chapters" else selected_chapter,
                    })

                if result:
                    st.markdown(result["answer"])
                    if result.get("sources"):
                        with st.expander(f"📄 {len(result['sources'])} source(s)"):
                            for s in result["sources"]:
                                score = f"· relevance {s['score']}" if s.get("score") else ""
                                st.caption(f"Page {s['page']} · {s['chapter']} {score}")
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": result["answer"],
                        "sources": result.get("sources", []),
                    })


# ── Quiz tab ──────────────────────────────────────────────────────────────────

with tab_quiz:
    st.markdown("### Mini Quiz")

    if not chapters:
        st.info("Upload a lecture PDF from the sidebar to start a quiz.")
    else:
        col1, col2, col3, col4 = st.columns([2, 2, 1, 1])
        with col1:
            quiz_course = st.selectbox("Course", course_options, key="quiz_course")
        with col2:
            chapter_options_quiz = sorted(
                c["chapter"] for c in chapters if c["course"] == quiz_course
            )
            quiz_chapter = st.selectbox("Chapter", chapter_options_quiz, key="quiz_chapter")
        with col3:
            quiz_difficulty = st.selectbox("Difficulty", ["easy", "medium", "hard"], index=1)
        with col4:
            num_questions = st.number_input("Questions", min_value=1, max_value=10, value=5)

        if st.button("Generate Quiz", type="primary"):
            with st.spinner("Generating questions..."):
                result = api("post", "/quiz", json={
                    "course": quiz_course,
                    "chapter": quiz_chapter,
                    "difficulty": quiz_difficulty,
                    "num_questions": int(num_questions),
                })
            if result:
                st.session_state.quiz_questions = result["questions"]
                st.session_state.quiz_submitted = False
                st.rerun()

        if "quiz_questions" in st.session_state and st.session_state.quiz_questions:
            questions = st.session_state.quiz_questions
            submitted = st.session_state.get("quiz_submitted", False)

            if not submitted:
                st.markdown("---")
                with st.form("quiz_form"):
                    user_answers = {}
                    for i, q in enumerate(questions):
                        st.markdown(f"**Q{i+1} of {len(questions)}** — {q['question']}")
                        user_answers[i] = st.radio(
                            f"q{i}", q.get("options", []),
                            key=f"q_{i}", label_visibility="collapsed",
                        )
                        st.markdown("")

                    if st.form_submit_button("Submit Answers", type="primary", use_container_width=True):
                        st.session_state.quiz_user_answers = user_answers
                        st.session_state.quiz_submitted = True
                        st.rerun()

            else:
                user_answers = st.session_state.get("quiz_user_answers", {})
                correct = 0

                # Score banner
                for i, q in enumerate(questions):
                    ua = user_answers.get(i, "")
                    if (ua[0] if ua else "") == q["answer"]:
                        correct += 1

                pct = int(correct / len(questions) * 100)
                grade = "🏆 Excellent!" if pct >= 80 else "👍 Good effort!" if pct >= 50 else "📖 Keep studying!"
                st.markdown(f"""
<div class="score-banner">
    <h2 style="margin:0;color:#fff">{correct}/{len(questions)}</h2>
    <p style="margin:4px 0 0;color:#8b8fa8">{pct}% · {grade}</p>
</div>""", unsafe_allow_html=True)

                # Results
                for i, q in enumerate(questions):
                    ua = user_answers.get(i, "")
                    is_correct = (ua[0] if ua else "") == q["answer"]
                    correct_opt = next((o for o in q["options"] if o.startswith(q["answer"])), q["answer"])
                    card_class = "quiz-card quiz-correct" if is_correct else "quiz-card quiz-wrong"
                    icon = "✅" if is_correct else "❌"

                    st.markdown(f"""
<div class="{card_class}">
    <p style="margin:0 0 8px;font-weight:600;color:#fff">{icon} Q{i+1}. {q['question']}</p>
    <p style="margin:0 0 4px;color:#8b8fa8;font-size:13px">Your answer: <span style="color:#fff">{ua or '—'}</span></p>
    {"" if is_correct else f'<p style="margin:0 0 4px;color:#8b8fa8;font-size:13px">Correct answer: <span style="color:#22c55e">{correct_opt}</span></p>'}
    <p style="margin:8px 0 0;color:#6b7280;font-size:12px">💡 {q['explanation']}</p>
</div>""", unsafe_allow_html=True)

                st.markdown("")
                if st.button("Retake Quiz", use_container_width=True):
                    del st.session_state.quiz_questions
                    st.session_state.quiz_submitted = False
                    st.rerun()
