"""
FastAPI Microservice for SUMMARIZER OP
Exposes existing Python AI pipelines (Mistral AI, LangChain LCEL, ChromaDB, Whisper)
over clean RESTful endpoints for the Node.js backend.
"""

import os
import sys
import tempfile
import shutil
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure root directory is on Python path to import core and utils
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

load_dotenv(os.path.join(ROOT_DIR, ".env"))

from core.llm_factory import get_llm, get_env_key
from core.summarise import summarise
from core.extractor import extract_action_items, extract_key_decisions, extract_questions
from core.translator import translate_to_hindi
from core.vector_store import build_vector_store, load_vector_store, CHROMA_DIR
from core.rag_engine import ask_rag, generate_suggested_questions
from utils.audio_processor import (
    extract_youtube_video_id,
    get_youtube_metadata,
    ingest_source
)

app = FastAPI(
    title="SUMMARIZER OP — AI Service",
    description="Python AI microservice handling Mistral AI summaries, Hindi translation, Whisper transcription, and ChromaDB RAG.",
    version="2.0.0"
)

# Enable CORS for local Node backend and frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for currently active indexed document info
_current_doc_info = {
    "doc_name": None,
    "char_count": 0,
    "total_chunks": 0,
    "suggested_questions": []
}

# ----------------- Request / Response Models -----------------

class VideoMetadataRequest(BaseModel):
    url: str

class SummarizeRequest(BaseModel):
    text: str
    provider: Optional[str] = None
    model: Optional[str] = None
    length: Optional[str] = "medium"  # short, medium, detailed
    mistral_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

class TranslateRequest(BaseModel):
    text: str
    provider: Optional[str] = None
    target_lang: Optional[str] = "hindi"
    mistral_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

class InsightsRequest(BaseModel):
    text: str
    provider: Optional[str] = None
    mistral_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

class RAGIndexTextRequest(BaseModel):
    text: str
    doc_name: str

class ChatMessage(BaseModel):
    role: str
    content: str

class RAGQueryRequest(BaseModel):
    query: str
    chat_history: Optional[List[ChatMessage]] = Field(default_factory=list)
    k: Optional[int] = 4
    provider: Optional[str] = None
    mistral_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

def _resolve_keys(request: Request, mistral_arg: Optional[str] = None, gemini_arg: Optional[str] = None):
    mk = mistral_arg or request.headers.get("x-mistral-api-key") or get_env_key("MISTRAL_API_KEY", "MISTRALAI_API_KEY", "MISTRAL_KEY")
    gk = gemini_arg or request.headers.get("x-gemini-api-key") or get_env_key("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY", "GEMINI_KEY")
    return (mk.strip() if mk else None), (gk.strip() if gk else None)

# ----------------- Endpoints -----------------

@app.get("/health")
def health(request: Request):
    mistral_h = request.headers.get("x-mistral-api-key")
    gemini_h = request.headers.get("x-gemini-api-key")

    mistral_configured = bool(mistral_h or get_env_key("MISTRAL_API_KEY", "MISTRALAI_API_KEY", "MISTRAL_KEY"))
    gemini_configured = bool(gemini_h or get_env_key("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY", "GEMINI_KEY"))
    ffmpeg_available = bool(shutil.which("ffmpeg"))

    return {
        "status": "healthy",
        "service": "SUMMARIZER OP — AI Service",
        "mistral_available": mistral_configured,
        "gemini_available": gemini_configured,
        "ffmpeg_available": ffmpeg_available,
        "default_mistral_model": get_env_key("MISTRAL_MODEL") or "ministral-8b-latest",
        "chroma_dir_exists": os.path.exists(CHROMA_DIR),
        "active_document": _current_doc_info["doc_name"]
    }

@app.post("/ai/video-metadata")
def get_video_info(req: VideoMetadataRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty.")
    
    meta = get_youtube_metadata(url)
    video_id = extract_youtube_video_id(url)
    meta["video_id"] = video_id
    return meta

@app.post("/ai/ingest-url")
def ingest_url(req: VideoMetadataRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty.")
    
    try:
        data = ingest_source(url)
        return {
            "title": data.get("title", "Ingested Content"),
            "source_type": data.get("source_type", "web"),
            "text": data.get("text", ""),
            "char_count": len(data.get("text", "")),
            "metadata": data.get("metadata", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest URL: {str(e)}")

@app.post("/ai/ingest-file")
async def ingest_file(file: UploadFile = File(...)):
    temp_path = None
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_path = tmp.name

        data = ingest_source(temp_path)
        text = data.get("text", "")

        return {
            "filename": file.filename,
            "title": file.filename,
            "source_type": data.get("source_type", "file"),
            "text": text,
            "char_count": len(text)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File parsing error: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.post("/ai/summarize")
def generate_summary(req: SummarizeRequest, request: Request):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # Apply length guidance to prompt text if specified
    guided_text = text
    if req.length == "short":
        guided_text = f"[Directive: Generate a concise, high-level summary under 150 words]\n\n{text}"
    elif req.length == "detailed":
        guided_text = f"[Directive: Generate an exhaustive, comprehensive breakdown covering all subtopics and nuances in detail]\n\n{text}"

    mistral_k, gemini_k = _resolve_keys(request, req.mistral_api_key, req.gemini_api_key)

    try:
        summary = summarise(
            guided_text,
            llm_provider=req.provider,
            mistral_api_key=mistral_k,
            gemini_api_key=gemini_k
        )
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/ai/translate")
def translate(req: TranslateRequest, request: Request):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    mistral_k, gemini_k = _resolve_keys(request, req.mistral_api_key, req.gemini_api_key)

    try:
        translation = translate_to_hindi(
            text,
            llm_provider=req.provider,
            mistral_api_key=mistral_k,
            gemini_api_key=gemini_k
        )
        return {"translation": translation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@app.post("/ai/extract-insights")
def extract_insights(req: InsightsRequest, request: Request):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    mistral_k, gemini_k = _resolve_keys(request, req.mistral_api_key, req.gemini_api_key)

    try:
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=3) as executor:
            fut_actions = executor.submit(extract_action_items, text, req.provider, mistral_k, gemini_k)
            fut_decisions = executor.submit(extract_key_decisions, text, req.provider, mistral_k, gemini_k)
            fut_questions = executor.submit(extract_questions, text, req.provider, mistral_k, gemini_k)

            actions = fut_actions.result()
            decisions = fut_decisions.result()
            questions = fut_questions.result()

        return {
            "action_items": actions,
            "key_decisions": decisions,
            "questions": questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insight extraction failed: {str(e)}")

@app.post("/ai/rag/index-text")
def rag_index_text(req: RAGIndexTextRequest):
    text = req.text.strip()
    doc_name = req.doc_name.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        vs = build_vector_store(text, collection_name="meeting_transcript")
        total_chunks = max(1, len(text) // 600)
        
        # Generate sample follow-up questions
        try:
            suggested = generate_suggested_questions(text, num_questions=4)
        except Exception:
            suggested = [
                "What are the main key points discussed?",
                "What action items or decisions were mentioned?",
                "What are the next steps outlined in this document?",
                "What background context was provided?"
            ]

        _current_doc_info["doc_name"] = doc_name
        _current_doc_info["char_count"] = len(text)
        _current_doc_info["total_chunks"] = total_chunks
        _current_doc_info["suggested_questions"] = suggested

        return {
            "success": True,
            "doc_name": doc_name,
            "char_count": len(text),
            "total_chunks": total_chunks,
            "suggested_questions": suggested
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG indexing failed: {str(e)}")

@app.post("/ai/rag/index-file")
async def rag_index_file(file: UploadFile = File(...)):
    temp_path = None
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_path = tmp.name

        data = ingest_source(temp_path)
        text = data.get("text", "").strip()

        if not text:
            raise HTTPException(status_code=400, detail="No readable text extracted from document.")

        vs = build_vector_store(text, collection_name="meeting_transcript")
        total_chunks = max(1, len(text) // 600)

        try:
            suggested = generate_suggested_questions(text, num_questions=4)
        except Exception:
            suggested = []

        _current_doc_info["doc_name"] = file.filename
        _current_doc_info["char_count"] = len(text)
        _current_doc_info["total_chunks"] = total_chunks
        _current_doc_info["suggested_questions"] = suggested

        return {
            "success": True,
            "doc_name": file.filename,
            "char_count": len(text),
            "total_chunks": total_chunks,
            "suggested_questions": suggested
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG file indexing failed: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.post("/ai/rag/query")
def rag_query(req: RAGQueryRequest, request: Request):
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    mistral_k, gemini_k = _resolve_keys(request, req.mistral_api_key, req.gemini_api_key)

    try:
        vs = load_vector_store(collection_name="meeting_transcript")
        chat_hist = [{"role": m.role, "content": m.content} for m in req.chat_history]

        result = ask_rag(
            query=query,
            vector_store=vs,
            chat_history=chat_hist,
            k=req.k or 4,
            llm_provider=req.provider,
            mistral_api_key=mistral_k,
            gemini_api_key=gemini_k
        )

        return {
            "answer": result.get("answer", ""),
            "sources": result.get("sources", []),
            "retrieved_count": result.get("retrieved_count", 0),
            "active_document": _current_doc_info["doc_name"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query error: {str(e)}")

@app.get("/ai/rag/status")
def rag_status():
    return {
        "active_document": _current_doc_info["doc_name"],
        "char_count": _current_doc_info["char_count"],
        "total_chunks": _current_doc_info["total_chunks"],
        "suggested_questions": _current_doc_info["suggested_questions"],
        "chroma_dir_exists": os.path.exists(CHROMA_DIR)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai_service.main:app", host="0.0.0.0", port=8000, reload=False)
