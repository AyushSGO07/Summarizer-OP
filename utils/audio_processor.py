import os
import re
import uuid
from typing import List, Optional, Dict, Any
import yt_dlp
from pydub import AudioSegment
from youtube_transcript_api import YouTubeTranscriptApi
import pypdf
import docx
import requests
from bs4 import BeautifulSoup

DOWNLOAD_DIR = "downloads"
CHUNKS_DIR = "chunks"

os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(CHUNKS_DIR, exist_ok=True)

def extract_youtube_video_id(url: str) -> Optional[str]:
    """
    Extracts the 11-character YouTube video ID from various YouTube URL formats.
    """
    patterns = [
        r"(?:v=|\/|embed\/|shorts\/|live\/)([0-9A-Za-z_-]{11})",
        r"^([0-9A-Za-z_-]{11})$"
    ]
    for pattern in patterns:
        match = re.search(pattern, url.strip())
        if match:
            return match.group(1)
    return None

def get_youtube_transcript_fast(url_or_id: str) -> Optional[str]:
    """
    Attempts to instantly retrieve the official or auto-generated YouTube subtitles/transcripts
    via YouTubeTranscriptApi. Avoids downloading large audio files when captions exist.
    """
    video_id = extract_youtube_video_id(url_or_id)
    if not video_id:
        return None

    try:
        api = YouTubeTranscriptApi()
        fetched = api.fetch(video_id)
        raw_snippets = fetched.to_raw_data()
        text_parts = [s.get("text", "").strip() for s in raw_snippets if s.get("text")]
        transcript = " ".join(text_parts)
        if transcript.strip():
            print(f"[AudioProcessor] Successfully extracted instant YouTube transcript ({len(transcript)} chars).")
            return transcript
    except Exception as e:
        print(f"[AudioProcessor] YouTube transcript API fetch skipped/failed ({e}). Falling back to audio download...")
    return None

def get_youtube_metadata(url_or_id: str) -> Dict[str, Any]:
    """
    Extracts real YouTube video metadata (title, author/channel, duration, thumbnail) without downloading.
    """
    video_id = extract_youtube_video_id(url_or_id)
    target_url = f"https://www.youtube.com/watch?v={video_id}" if video_id else url_or_id.strip()

    try:
        ydl_opts = {
            "skip_download": True,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target_url, download=False)
            return {
                "title": info.get("title", f"YouTube Video ({video_id or 'Unknown'})"),
                "channel": info.get("uploader") or info.get("channel", "YouTube"),
                "duration": info.get("duration", 0),
                "thumbnail": info.get("thumbnail"),
                "view_count": info.get("view_count", 0),
                "upload_date": info.get("upload_date", ""),
                "description": info.get("description", "")[:280] if info.get("description") else ""
            }
    except Exception as e:
        print(f"[AudioProcessor] Metadata fetch skipped/failed: {e}")
        return {
            "title": f"YouTube Video ({video_id or 'Video'})",
            "channel": "YouTube",
            "duration": 0,
            "thumbnail": None,
            "view_count": 0,
            "upload_date": "",
            "description": ""
        }

def download_youtube_audio(url: str, output_dir: str = DOWNLOAD_DIR) -> Optional[str]:
    """
    Downloads audio from YouTube using yt-dlp and extracts it to WAV format.
    """
    try:
        unique_id = uuid.uuid4().hex[:8]
        out_template = os.path.join(output_dir, f"yt_audio_{unique_id}.%(ext)s")
        
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                    "preferredquality": "192",
                }
            ],
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            audio_path = os.path.splitext(filename)[0] + ".wav"

        if os.path.exists(audio_path):
            print(f"[AudioProcessor] Downloaded YouTube audio: {audio_path}")
            return audio_path
        return None

    except Exception as e:
        print(f"[AudioProcessor] Error downloading audio: {e}")
        return None

def convert_to_wav(input_path: str, output_path: Optional[str] = None) -> str:
    """
    Converts any audio or video file to 16kHz mono WAV suitable for Whisper.
    Fixed critical bug where audio was never exported to output_path.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        base, _ = os.path.splitext(input_path)
        output_path = f"{base}_conv.wav"

    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1).set_frame_rate(16000)
    audio.export(output_path, format="wav")
    print(f"[AudioProcessor] Converted audio to WAV: {output_path}")
    return output_path

def chunk_audio(wav_path: str, chunk_size_minutes: int = 10, output_dir: str = CHUNKS_DIR) -> List[str]:
    """
    Splits an audio file into chunks for batch processing with Whisper.
    """
    if not os.path.exists(wav_path):
        raise FileNotFoundError(f"WAV file not found: {wav_path}")

    audio = AudioSegment.from_wav(wav_path)
    chunk_ms = chunk_size_minutes * 60 * 1000
    os.makedirs(output_dir, exist_ok=True)
    
    unique_prefix = uuid.uuid4().hex[:6]
    chunks = []
    
    # If audio is shorter than chunk size, export single chunk
    if len(audio) <= chunk_ms:
        chunk_path = os.path.join(output_dir, f"chunk_{unique_prefix}_0.wav")
        audio.export(chunk_path, format="wav")
        return [chunk_path]

    for i in range(0, len(audio), chunk_ms):
        chunk = audio[i:i + chunk_ms]
        chunk_path = os.path.join(output_dir, f"chunk_{unique_prefix}_{i // chunk_ms}.wav")
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)

    print(f"[AudioProcessor] Audio split into {len(chunks)} chunks.")
    return chunks

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts text content from a PDF document.
    """
    reader = pypdf.PdfReader(pdf_path)
    text_parts = []
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            text_parts.append(txt)
    return "\n\n".join(text_parts).strip()

def extract_text_from_docx(docx_path: str) -> str:
    """
    Extracts text content from a Microsoft Word DOCX document.
    """
    doc = docx.Document(docx_path)
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip()]).strip()

def extract_text_from_webpage(url: str) -> str:
    """
    Scrapes main readable text from a web article or meeting notes link.
    """
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = requests.get(url, headers=headers, timeout=12)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove irrelevant script, style, and navigation tags
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    text = soup.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)

def process_input(source: str, force_download: bool = False) -> List[str]:
    """
    Original pipeline compatibility function:
    Given a YouTube URL or local file, downloads/converts and returns a list of WAV chunk file paths.
    """
    if source.startswith("http://") or source.startswith("https://"):
        print(f"[AudioProcessor] Detected URL: {source}")
        wav_path = download_youtube_audio(source)
        if not wav_path:
            raise RuntimeError(f"Failed to download audio from: {source}")
    else:
        print(f"[AudioProcessor] Detected local file: {source}")
        wav_path = convert_to_wav(source)

    chunks = chunk_audio(wav_path)
    return chunks

def ingest_source(source: str) -> Dict[str, Any]:
    """
    Universal ingestion helper that returns full text, metadata, and chunk files if needed.
    Supports: YouTube URLs, Web URLs, Audio/Video files, PDF, DOCX, TXT.
    """
    source_clean = source.strip()

    # 1. YouTube URL
    if "youtube.com" in source_clean.lower() or "youtu.be" in source_clean.lower():
        meta = get_youtube_metadata(source_clean)
        # Try fast transcript first
        fast_text = get_youtube_transcript_fast(source_clean)
        if fast_text:
            return {
                "source_type": "youtube_captions",
                "text": fast_text,
                "title": meta.get("title") or f"YouTube Video ({extract_youtube_video_id(source_clean)})",
                "metadata": meta,
                "chunks": []
            }
        # Fallback to audio download + Whisper chunking
        wav_path = download_youtube_audio(source_clean)
        if wav_path:
            chunks = chunk_audio(wav_path)
            from core.transcriber import transcribe_all
            text = transcribe_all(chunks)
            return {
                "source_type": "youtube_whisper",
                "text": text,
                "title": meta.get("title") or "YouTube Video Audio",
                "metadata": meta,
                "chunks": chunks
            }
        raise RuntimeError("Failed to extract YouTube transcript or download audio.")

    # 2. General Web URL
    elif source_clean.startswith("http://") or source_clean.startswith("https://"):
        text = extract_text_from_webpage(source_clean)
        return {
            "source_type": "webpage",
            "text": text,
            "title": source_clean,
            "chunks": []
        }

    # 3. Local Document or Audio/Video File
    elif os.path.exists(source_clean):
        ext = os.path.splitext(source_clean)[1].lower()
        
        if ext == ".pdf":
            text = extract_text_from_pdf(source_clean)
            return {"source_type": "pdf", "text": text, "title": os.path.basename(source_clean), "chunks": []}
            
        elif ext in (".docx", ".doc"):
            text = extract_text_from_docx(source_clean)
            return {"source_type": "docx", "text": text, "title": os.path.basename(source_clean), "chunks": []}
            
        elif ext in (".txt", ".md", ".csv", ".json"):
            with open(source_clean, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            return {"source_type": "text", "text": text, "title": os.path.basename(source_clean), "chunks": []}
            
        elif ext in (".wav", ".mp3", ".m4a", ".ogg", ".flac", ".mp4", ".mkv", ".mov", ".webm"):
            conv_wav = convert_to_wav(source_clean)
            chunks = chunk_audio(conv_wav)
            from core.transcriber import transcribe_all
            text = transcribe_all(chunks)
            return {
                "source_type": "media_file",
                "text": text,
                "title": os.path.basename(source_clean),
                "chunks": chunks
            }
        else:
            with open(source_clean, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            return {"source_type": "file", "text": text, "title": os.path.basename(source_clean), "chunks": []}

    # 4. Direct Raw Text Input
    else:
        return {
            "source_type": "raw_text",
            "text": source_clean,
            "title": "Direct Text Input",
            "chunks": []
        }
