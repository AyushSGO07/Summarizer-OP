import os
from typing import List, Union
from dotenv import load_dotenv

load_dotenv()

DEFAULT_WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base").strip()

_model = None

def load_model(model_name: str = DEFAULT_WHISPER_MODEL):
    """
    Lazy loads and caches the OpenAI Whisper model.
    """
    global _model
    if _model is None:
        try:
            import whisper
            print(f"[Transcriber] Loading Whisper model: '{model_name}'...")
            _model = whisper.load_model(model_name)
            print("[Transcriber] Whisper model loaded successfully.")
        except Exception as e:
            print(f"[Transcriber] Error loading Whisper model: {e}")
            raise e
    return _model

def transcribe_chunk(chunk_path: str, translate: bool = False, model_name: str = DEFAULT_WHISPER_MODEL) -> str:
    """
    Transcribes a single audio chunk using Whisper.
    """
    if not os.path.exists(chunk_path):
        raise FileNotFoundError(f"Audio file not found: {chunk_path}")

    model = load_model(model_name)
    task = "translate" if translate else "transcribe"
    result = model.transcribe(chunk_path, task=task, fp16=False)
    return result.get("text", "").strip()

def transcribe_all(chunks: Union[List[str], str], translate: bool = False) -> str:
    """
    Transcribes a list of audio chunks or a single audio file and joins the transcripts.
    """
    if isinstance(chunks, str):
        chunks = [chunks]

    if not chunks:
        return ""

    transcripts = []
    total = len(chunks)
    for idx, chunk in enumerate(chunks, 1):
        if not os.path.exists(chunk):
            print(f"[Transcriber] Skipping missing chunk: {chunk}")
            continue
        print(f"[Transcriber] Processing chunk {idx}/{total}: {chunk}")
        text = transcribe_chunk(chunk_path=chunk, translate=translate)
        if text:
            transcripts.append(text)

    return " ".join(transcripts).strip()
