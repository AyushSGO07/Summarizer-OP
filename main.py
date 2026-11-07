"""
SUMMARIZER OP — FastAPI Application Entry Point for Vercel and Local Execution
"""
import os
import sys

# Ensure root directory is on Python path
ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ai_service.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
