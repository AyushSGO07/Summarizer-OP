import os
import shutil
import tempfile
from typing import List, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

if os.environ.get("VERCEL"):
    CHROMA_DIR = os.path.join(tempfile.gettempdir(), "vector_db")
else:
    CHROMA_DIR = "vector_db"
COLLECTION_NAME = "meeting_transcript"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

_cached_embedding = None

def get_embedding():
    """
    Returns an embedding instance.
    Prefers HuggingFaceEmbeddings (all-MiniLM-L6-v2).
    Falls back to GoogleGenerativeAIEmbeddings in serverless environments or when torch is absent.
    """
    global _cached_embedding
    if _cached_embedding is None:
        try:
            device = "cpu"
            try:
                import torch
                if torch.cuda.is_available():
                    device = "cuda"
            except Exception:
                device = "cpu"

            from langchain_community.embeddings import HuggingFaceEmbeddings
            _cached_embedding = HuggingFaceEmbeddings(
                model_name=EMBEDDING_MODEL,
                model_kwargs={"device": device},
                encode_kwargs={"normalize_embeddings": True}
            )
        except Exception as e:
            gemini_key = os.environ.get("GEMINI_API_KEY")
            if gemini_key:
                from langchain_google_genai import GoogleGenerativeAIEmbeddings
                _cached_embedding = GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=gemini_key
                )
            else:
                raise RuntimeError(
                    f"HuggingFace embeddings could not be initialized ({str(e)}) and GEMINI_API_KEY is not set."
                )
    return _cached_embedding

def build_vector_store(
    transcript: str,
    collection_name: str = COLLECTION_NAME,
    persist_directory: str = CHROMA_DIR,
    chunk_size: int = 600,
    chunk_overlap: int = 80,
    clear_existing: bool = True,
    metadata_extra: Optional[dict] = None
):
    """
    Splits transcript into semantic chunks and builds a persistent Chroma vector store.
    """
    if not transcript or not transcript.strip():
        raise ValueError("Cannot build vector store from empty transcript.")

    from langchain_chroma import Chroma

    os.makedirs(persist_directory, exist_ok=True)
    embeddings = get_embedding()

    # Clear existing collection if requested to avoid mixing different meetings
    if clear_existing:
        try:
            temp_store = Chroma(
                collection_name=collection_name,
                embedding_function=embeddings,
                persist_directory=persist_directory
            )
            temp_store.delete_collection()
        except Exception:
            pass

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = splitter.split_text(transcript)

    docs = []
    base_meta = metadata_extra or {}
    for i, chunk in enumerate(chunks):
        meta = {
            "chunk_index": i,
            "total_chunks": len(chunks),
            "char_count": len(chunk),
            **base_meta
        }
        docs.append(Document(page_content=chunk, metadata=meta))

    vector_store = Chroma.from_documents(
        documents=docs,
        collection_name=collection_name,
        persist_directory=persist_directory,
        embedding=embeddings
    )
    return vector_store

def load_vector_store(
    collection_name: str = COLLECTION_NAME,
    persist_directory: str = CHROMA_DIR
):
    """
    Loads an existing persistent Chroma vector store correctly.
    """
    from langchain_chroma import Chroma
    embeddings = get_embedding()
    vector_store = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=persist_directory
    )
    return vector_store

def get_retriever(vector_store, k: int = 4, search_type: str = "similarity"):
    """
    Returns a configured retriever for the vector store.
    """
    return vector_store.as_retriever(
        search_type=search_type,
        search_kwargs={"k": k}
    )

get_retiever = get_retriever
