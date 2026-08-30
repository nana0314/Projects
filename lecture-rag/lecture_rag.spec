# lecture_rag.spec
from PyInstaller.utils.hooks import collect_data_files, copy_metadata

block_cipher = None

datas = []
datas += collect_data_files("streamlit")
datas += collect_data_files("llama_index")
datas += collect_data_files("llama_index_core")
datas += collect_data_files("chromadb")
datas += collect_data_files("altair")
datas += collect_data_files("tiktoken_ext")
datas += collect_data_files("nltk")
datas += collect_data_files("PIL")
# Package metadata required by streamlit and others at runtime
datas += copy_metadata("streamlit")
datas += copy_metadata("fastapi")
datas += copy_metadata("starlette")
datas += copy_metadata("openai")
datas += copy_metadata("llama_index")
# Bundle backend and frontend source so launcher can reference them at runtime
datas += [
    ("backend", "backend"),
    ("frontend", "frontend"),
]

hiddenimports = [
    # llama-index
    "llama_index.core",
    "llama_index.embeddings.openai",
    "llama_index.llms.openai",
    "llama_index.vector_stores.chroma",
    "llama_index.readers.file",
    # chromadb
    "chromadb",
    "chromadb.api",
    "chromadb.api.models",
    "chromadb.db.impl",
    "chromadb.db.impl.sqlite",
    # uvicorn
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
    # fastapi / starlette
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
    # streamlit internals
    "streamlit.web.cli",
    "streamlit.web.bootstrap",
    # misc
    "pydantic",
    "fitz",
    "tiktoken",
    "openai",
    "PIL",
    "PIL.Image",
    "PIL._imaging",
    "pillow",
]

a = Analysis(
    ["launcher.py"],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["matplotlib", "scipy", "PIL", "cv2"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="LectureRAG",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Temporarily enabled to debug startup
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="LectureRAG",
)
