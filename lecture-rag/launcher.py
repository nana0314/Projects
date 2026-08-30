"""
Lecture RAG — Desktop launcher.

Modes (controlled by argv flags):
  (no flags)   Main launcher: setup, spawn subprocesses, open browser, show control window
  --backend    Run the FastAPI server (uvicorn)
  --frontend   Run the Streamlit app
"""
import multiprocessing
multiprocessing.freeze_support()

import os
import subprocess
import sys
import time
import traceback
import webbrowser
import tkinter as tk
from tkinter import simpledialog, messagebox

APP_NAME = "LectureRAG"
BACKEND_PORT = 8000
FRONTEND_PORT = 8501


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_base_dir():
    """Root of bundled files (sys._MEIPASS) or project root in dev."""
    if getattr(sys, "frozen", False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


def get_app_data_dir():
    base = os.environ.get("APPDATA", os.path.expanduser("~"))
    path = os.path.join(base, APP_NAME)
    os.makedirs(path, exist_ok=True)
    return path


def log(msg: str):
    """Write to a log file in AppData so we can debug even with console=False."""
    try:
        log_path = os.path.join(get_app_data_dir(), "launcher.log")
        with open(log_path, "a") as f:
            f.write(msg + "\n")
    except Exception:
        pass


def load_or_prompt_api_key(app_data_dir: str) -> str:
    key_file = os.path.join(app_data_dir, "api_key.txt")
    if os.path.exists(key_file):
        with open(key_file) as f:
            key = f.read().strip()
        if key:
            return key

    root = tk.Tk()
    root.withdraw()
    root.lift()
    key = simpledialog.askstring(
        "OpenAI API Key",
        "Enter your OpenAI API key to get started:\n(starts with sk-)",
        show="*",
        parent=root,
    )
    root.destroy()

    if not key or not key.strip():
        messagebox.showerror("Error", "An OpenAI API key is required.")
        sys.exit(1)

    key = key.strip()
    with open(key_file, "w") as f:
        f.write(key)
    return key


# ── Modes ─────────────────────────────────────────────────────────────────────

def run_backend():
    log("Backend starting...")
    base = get_base_dir()
    backend_dir = os.path.join(base, "backend")
    sys.path.insert(0, backend_dir)
    log(f"Backend dir: {backend_dir}")

    try:
        import main as backend_main
        import uvicorn
        log("Backend imports OK, starting uvicorn...")
        uvicorn.run(backend_main.app, host="127.0.0.1", port=BACKEND_PORT, log_level="warning")
    except Exception as e:
        log(f"Backend error: {traceback.format_exc()}")
        raise


def run_frontend():
    log("Frontend starting...")
    base = get_base_dir()
    frontend_script = os.path.join(base, "frontend", "app.py")
    log(f"Frontend script: {frontend_script}")

    try:
        from streamlit.web import cli as stcli
        sys.argv = [
            "streamlit", "run", frontend_script,
            f"--server.port={FRONTEND_PORT}",
            "--server.headless=true",
            "--browser.gatherUsageStats=false",
        ]
        log("Streamlit import OK, starting...")
        stcli.main()
    except Exception as e:
        log(f"Frontend error: {traceback.format_exc()}")
        raise


def run_launcher():
    log("=== Launcher started ===")
    try:
        app_data_dir = get_app_data_dir()
        api_key = load_or_prompt_api_key(app_data_dir)
        chroma_path = os.path.join(app_data_dir, "chroma_db")
        log(f"Chroma path: {chroma_path}")

        env = os.environ.copy()
        env["OPENAI_API_KEY"] = api_key
        env["CHROMA_PATH"] = chroma_path
        env["STREAMLIT_GLOBAL_DEVELOPMENTMODE"] = "false"
        env["STREAMLIT_BROWSER_GATHER_USAGE_STATS"] = "false"

        exe = sys.executable
        log(f"Executable: {exe}")

        log("Spawning backend...")
        backend_proc = subprocess.Popen(
            [exe, "--backend"], env=env,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        log("Spawning frontend...")
        frontend_proc = subprocess.Popen(
            [exe, "--frontend"], env=env,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        log("Both subprocesses spawned, waiting 4s...")
        time.sleep(4)
        webbrowser.open(f"http://localhost:{FRONTEND_PORT}")

        # Control window
        root = tk.Tk()
        root.title("Lecture RAG")
        root.resizable(False, False)
        root.geometry("320x140")

        tk.Label(root, text="Lecture RAG is running", font=("Arial", 13, "bold")).pack(pady=(20, 4))
        tk.Label(root, text=f"http://localhost:{FRONTEND_PORT}", fg="#2980b9",
                 cursor="hand2").pack()

        def on_close():
            log("Shutting down...")
            backend_proc.terminate()
            frontend_proc.terminate()
            root.destroy()

        tk.Button(root, text="Stop & Exit", command=on_close,
                  bg="#e74c3c", fg="white", width=16).pack(pady=14)
        root.protocol("WM_DELETE_WINDOW", on_close)
        root.mainloop()

    except Exception as e:
        log(f"Launcher error: {traceback.format_exc()}")
        messagebox.showerror("Lecture RAG Error", f"Failed to start:\n\n{e}\n\nSee launcher.log in %APPDATA%\\LectureRAG\\")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if "--backend" in sys.argv:
        run_backend()
    elif "--frontend" in sys.argv:
        run_frontend()
    else:
        run_launcher()
