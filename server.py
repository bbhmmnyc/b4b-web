"""Compatibility entry point for running the backend from the repo root.

The canonical backend application lives in backend/server.py. This shim keeps
existing commands such as `uvicorn server:app` working from the project root.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from backend.server import app  # noqa: E402,F401
