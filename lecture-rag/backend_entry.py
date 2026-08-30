"""
PyInstaller entry point for the FastAPI backend.
Electron spawns this executable directly.
"""
import sys
import os
import logging

# ── File logging so errors are visible even with console=False ─────────────────
log_dir = os.path.join(
    os.environ.get("APPDATA", os.path.expanduser("~")), "LectureRAG"
)
os.makedirs(log_dir, exist_ok=True)
log_path = os.path.join(log_dir, "backend.log")

logging.basicConfig(
    filename=log_path,
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
# also capture uvicorn and fastapi logs
logging.getLogger("uvicorn").setLevel(logging.DEBUG)
logging.getLogger("uvicorn.error").setLevel(logging.DEBUG)
logging.getLogger("fastapi").setLevel(logging.DEBUG)

if getattr(sys, "frozen", False):
    backend_dir = os.path.join(sys._MEIPASS, "backend")
else:
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")

sys.path.insert(0, backend_dir)

logging.info("Backend starting. backend_dir=%s", backend_dir)
logging.info("OPENAI_API_KEY set: %s", bool(os.environ.get("OPENAI_API_KEY")))
logging.info("CHROMA_PATH: %s", os.environ.get("CHROMA_PATH", "(not set)"))

import uvicorn
import main as backend_main

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", "8000"))
    logging.info("Starting uvicorn on port %d", port)
    uvicorn.run(backend_main.app, host="127.0.0.1", port=port, log_level="debug")
