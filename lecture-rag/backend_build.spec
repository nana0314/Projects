# backend_build.spec — PyInstaller spec for FastAPI backend only (no Streamlit)
from PyInstaller.utils.hooks import collect_data_files, copy_metadata

block_cipher = None

datas = []
datas += collect_data_files("llama_index")
datas += collect_data_files("llama_index_core")
datas += collect_data_files("chromadb")
datas += collect_data_files("tiktoken_ext")
datas += collect_data_files("nltk")
datas += collect_data_files("PIL")
datas += collect_data_files("pymupdf")
datas += copy_metadata("pymupdf")
datas += copy_metadata("python-dotenv")
datas += copy_metadata("fastapi")
datas += copy_metadata("starlette")
datas += copy_metadata("openai")
datas += copy_metadata("llama_index")
datas += [("backend", "backend")]

hiddenimports = [
    "llama_index.core",
    "llama_index.embeddings.openai",
    "llama_index.llms.openai",
    "llama_index.vector_stores.chroma",
    "llama_index.readers.file",
    "chromadb",
    "chromadb.api",
    "chromadb.api.models",
    "chromadb.db.impl",
    "chromadb.db.impl.sqlite",
    "uvicorn",
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "fastapi",
    "fastapi.middleware",
    "fastapi.middleware.cors",
    "starlette",
    "starlette.middleware",
    "starlette.middleware.cors",
    "starlette.middleware.base",
    "starlette.routing",
    "starlette.responses",
    "starlette.requests",
    "pydantic",
    "fitz",
    "tiktoken",
    "openai",
    "PIL",
    "PIL.Image",
    "PIL._imaging",
    "pymupdf",
    "fitz",
    "fitz.utils",
    "dotenv",
    "python_dotenv",
]

a = Analysis(
    ["backend_entry.py"],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=["streamlit", "matplotlib", "scipy", "cv2", "tkinter"],
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="backend",
    debug=False,
    strip=False,
    upx=True,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    name="backend",
)
