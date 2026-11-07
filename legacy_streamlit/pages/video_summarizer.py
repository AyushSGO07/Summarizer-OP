"""
Video Summarization Page
Handles YouTube URL validation, metadata extraction, transcription (captions/Whisper),
LCEL executive summarization via Mistral AI, Hindi translation, and action item extraction.
"""

import streamlit as st
import datetime
from frontend.components import render_header, render_bilingual_summary, render_metric_cards
from utils.audio_processor import extract_youtube_video_id, get_youtube_metadata, ingest_source
from core.summarise import summarise
from core.extractor import extract_action_items, extract_key_decisions, extract_questions
from core.translator import translate_to_hindi
from core.vector_store import build_vector_store

def render_video_summarizer_page():
    render_header(
        title="🎬 Video Summarization",
        subtitle="Ingest YouTube videos, extract transcripts, generate executive summaries, and translate into Hindi.",
        badge="YouTube & Video Pipeline"
    )

    # Input Box & Actions
    col_input, col_btn = st.columns([4, 1])
    with col_input:
        video_url = st.text_input(
            "Enter YouTube or Video URL",
            placeholder="e.g., https://www.youtube.com/watch?v=...",
            label_visibility="collapsed"
        )
    with col_btn:
        process_btn = st.button("Summarize Video", use_container_width=True)

    # Store last video result in session state
    if "last_video_result" not in st.session_state:
        st.session_state["last_video_result"] = None

    if process_btn:
        if not video_url or not video_url.strip():
            st.error("⚠️ Please enter a valid video URL.")
            return

        cleaned_url = video_url.strip()
        video_id = extract_youtube_video_id(cleaned_url)

        if not video_id and not (cleaned_url.startswith("http://") or cleaned_url.startswith("https://")):
            st.error("⚠️ Invalid URL format. Please provide a supported YouTube or Web link.")
            return

        # Start Processing Pipeline
        with st.status("🔄 Processing Video Intelligence Pipeline...", expanded=True) as status:
            try:
                # Step 1: Metadata Extraction
                status.write("🔍 Step 1/5: Fetching video metadata...")
                meta = get_youtube_metadata(cleaned_url)
                
                # Step 2: Ingestion & Transcription
                status.write("🎙️ Step 2/5: Extracting audio transcript (captions / Whisper)...")
                ingested = ingest_source(cleaned_url)
                transcript = ingested.get("text", "").strip()

                if not transcript:
                    raise ValueError("No audible speech or transcript could be extracted from this video.")

                status.write(f"✅ Ingested {len(transcript)} characters of transcript text.")

                # Step 3: Mistral LCEL Executive Summary
                status.write("⚡ Step 3/5: Generating Executive Summary with Mistral AI...")
                provider = st.session_state.get("llm_provider", "mistral")
                english_summary = summarise(transcript, llm_provider=provider)

                # Step 4: English-to-Hindi Translation
                status.write("🇮🇳 Step 4/5: Translating summary into natural Hindi...")
                hindi_summary = translate_to_hindi(english_summary, llm_provider=provider)

                # Step 5: Action Items & Insights
                status.write("🎯 Step 5/5: Extracting action items and key decisions...")
                actions = extract_action_items(transcript, llm_provider=provider)
                decisions = extract_key_decisions(transcript, llm_provider=provider)
                questions = extract_questions(transcript, llm_provider=provider)

                status.update(label="✅ Processing Complete!", state="complete", expanded=False)

                result_data = {
                    "url": cleaned_url,
                    "title": meta.get("title", ingested.get("title", "YouTube Video")),
                    "channel": meta.get("channel", "YouTube"),
                    "duration": meta.get("duration", 0),
                    "thumbnail": meta.get("thumbnail"),
                    "transcript": transcript,
                    "source_type": ingested.get("source_type", "youtube"),
                    "english_summary": english_summary,
                    "hindi_summary": hindi_summary,
                    "actions": actions,
                    "decisions": decisions,
                    "questions": questions,
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }

                st.session_state["last_video_result"] = result_data

                # Append to session history
                if "summary_history" not in st.session_state:
                    st.session_state["summary_history"] = []
                st.session_state["summary_history"].append(result_data)

            except Exception as e:
                status.update(label=f"❌ Error: {str(e)}", state="error", expanded=True)
                st.error(f"Processing failed: {str(e)}")
                return

    # Render Active Video Results
    res = st.session_state.get("last_video_result")
    if res:
        st.markdown("<br>", unsafe_allow_html=True)
        # Video Metadata Card
        meta_col1, meta_col2 = st.columns([1, 3])
        with meta_col1:
            if res.get("thumbnail"):
                st.image(res["thumbnail"], use_container_width=True)
            else:
                st.markdown('<div class="glass-card" style="text-align:center; font-size:3rem;">🎬</div>', unsafe_allow_html=True)
        
        with meta_col2:
            st.markdown(f"### {res['title']}")
            duration_min = round(res['duration'] / 60, 1) if res.get('duration') else "N/A"
            st.markdown(
                f"""
                <p style="color: #94A3B8; margin-bottom: 0.5rem;">
                    <b>Channel:</b> {res.get('channel', 'Unknown')} &nbsp;|&nbsp; 
                    <b>Duration:</b> {duration_min} mins &nbsp;|&nbsp;
                    <b>Source:</b> {res.get('source_type', 'Video')}
                </p>
                """,
                unsafe_allow_html=True
            )
            c1, c2 = st.columns([1, 1])
            with c1:
                if st.button("💬 Chat with this Video in RAG", key="btn_send_video_rag"):
                    # Index directly into ChromaDB for Q&A
                    with st.spinner("Indexing video transcript into ChromaDB..."):
                        clean_col_name = f"rag_video_{res.get('url', 'clip')[-8:]}".replace("-", "_").replace("=", "_")
                        vs = build_vector_store(res["transcript"], collection_name="meeting_transcript")
                        st.session_state["active_vector_store"] = vs
                        st.session_state["active_document_name"] = res["title"]
                        st.session_state["active_document_text"] = res["transcript"]
                        st.session_state["active_chunks_count"] = max(1, len(res["transcript"]) // 600)
                        st.session_state["nav_selection"] = "Ask Your Documents"
                        st.rerun()

        # Render Bilingual Summary Tabs
        render_bilingual_summary(
            english_summary=res["english_summary"],
            hindi_summary=res["hindi_summary"],
            action_items=res["actions"],
            key_decisions=res["decisions"],
            questions=res["questions"],
            key_prefix="vid"
        )

        # Full Original Transcript Expander
        with st.expander("📜 Original Full Transcript (English)", expanded=False):
            st.text_area("Full Extracted Transcript", res["transcript"], height=250)
