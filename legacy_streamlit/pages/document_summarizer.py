"""
Document Summarizer Page
Handles drag-and-drop file uploads (PDF, DOCX, TXT, MD, CSV, Audio/Video),
extracts text via backend utilities, produces Mistral LCEL summaries,
generates Hindi translations, and extracts structured action items.
"""

import os
import tempfile
import datetime
import streamlit as st
from frontend.components import render_header, render_bilingual_summary, render_metric_cards
from utils.audio_processor import ingest_source
from core.summarise import summarise
from core.extractor import extract_action_items, extract_key_decisions, extract_questions
from core.translator import translate_to_hindi
from core.vector_store import build_vector_store

def render_document_summarizer_page():
    render_header(
        title="📄 Document Summarization",
        subtitle="Upload reports, PDFs, meeting notes, or media files to generate executive summaries and Hindi translations.",
        badge="Document & File Intelligence"
    )

    # Supported File Formats
    allowed_types = ["pdf", "docx", "doc", "txt", "md", "csv", "json", "wav", "mp3", "m4a", "mp4"]

    uploaded_file = st.file_uploader(
        "Upload a document or audio/video file",
        type=allowed_types,
        help="Supports PDF, Word (DOCX), Text (TXT, MD), CSV, JSON, and Audio/Video files."
    )

    if uploaded_file is not None:
        file_size_kb = round(len(uploaded_file.getvalue()) / 1024, 2)
        file_size_mb = round(file_size_kb / 1024, 2)
        size_str = f"{file_size_mb} MB" if file_size_mb >= 1.0 else f"{file_size_kb} KB"

        st.markdown(
            f"""
            <div class="glass-card" style="padding: 1rem 1.4rem; margin-top: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-weight: 700; font-size: 1.05rem;">📎 {uploaded_file.name}</span>
                        <span style="color: #94A3B8; font-size: 0.85rem; margin-left: 0.8rem;">Size: {size_str}</span>
                    </div>
                    <span class="status-pill status-active">Ready for Analysis</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        col_act1, col_act2 = st.columns([1, 3])
        with col_act1:
            process_btn = st.button("Summarize Document", use_container_width=True)

        if process_btn:
            with st.status("🔄 Processing Document Intelligence Pipeline...", expanded=True) as status:
                temp_path = None
                try:
                    # Save temporarily to disk for backend file parsers
                    suffix = os.path.splitext(uploaded_file.name)[1]
                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                        tmp.write(uploaded_file.getvalue())
                        temp_path = tmp.name

                    # Step 1: Text Ingestion via backend ingest_source
                    status.write(f"📖 Step 1/4: Parsing content from {uploaded_file.name}...")
                    ingested = ingest_source(temp_path)
                    doc_text = ingested.get("text", "").strip()

                    if not doc_text:
                        raise ValueError("No readable text could be extracted from this file.")

                    status.write(f"✅ Extracted {len(doc_text)} characters.")

                    # Step 2: Mistral LCEL Executive Summary
                    status.write("⚡ Step 2/4: Generating Executive Summary with Mistral AI...")
                    provider = st.session_state.get("llm_provider", "mistral")
                    english_summary = summarise(doc_text, llm_provider=provider)

                    # Step 3: English-to-Hindi Translation
                    status.write("🇮🇳 Step 3/4: Translating summary into natural Hindi...")
                    hindi_summary = translate_to_hindi(english_summary, llm_provider=provider)

                    # Step 4: Extract Key Facets
                    status.write("🎯 Step 4/4: Extracting action items and decisions...")
                    actions = extract_action_items(doc_text, llm_provider=provider)
                    decisions = extract_key_decisions(doc_text, llm_provider=provider)
                    questions = extract_questions(doc_text, llm_provider=provider)

                    status.update(label="✅ Document Summarization Complete!", state="complete", expanded=False)

                    doc_result = {
                        "name": uploaded_file.name,
                        "size": size_str,
                        "text": doc_text,
                        "source_type": ingested.get("source_type", "document"),
                        "english_summary": english_summary,
                        "hindi_summary": hindi_summary,
                        "actions": actions,
                        "decisions": decisions,
                        "questions": questions,
                        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }

                    st.session_state["last_doc_result"] = doc_result

                    # Add to session history
                    if "summary_history" not in st.session_state:
                        st.session_state["summary_history"] = []
                    st.session_state["summary_history"].append(doc_result)

                except Exception as e:
                    status.update(label=f"❌ Processing Error: {str(e)}", state="error", expanded=True)
                    st.error(f"Failed to process document: {str(e)}")
                    return
                finally:
                    if temp_path and os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                        except Exception:
                            pass

    # Render Document Results
    doc_res = st.session_state.get("last_doc_result")
    if doc_res:
        st.markdown("<br>", unsafe_allow_html=True)
        col_hdr1, col_hdr2 = st.columns([3, 1])
        with col_hdr1:
            st.markdown(f"### 📑 {doc_res['name']}")
            st.caption(f"Processed at {doc_res['timestamp']} | Size: {doc_res['size']} | Type: {doc_res['source_type']}")
        with col_hdr2:
            if st.button("💬 Chat with this Document in RAG", key="btn_send_doc_rag", use_container_width=True):
                with st.spinner("Indexing document into ChromaDB..."):
                    vs = build_vector_store(doc_res["text"], collection_name="meeting_transcript")
                    st.session_state["active_vector_store"] = vs
                    st.session_state["active_document_name"] = doc_res["name"]
                    st.session_state["active_document_text"] = doc_res["text"]
                    st.session_state["active_chunks_count"] = max(1, len(doc_res["text"]) // 600)
                    st.session_state["nav_selection"] = "Ask Your Documents"
                    st.rerun()

        # Render Bilingual Tabs
        render_bilingual_summary(
            english_summary=doc_res["english_summary"],
            hindi_summary=doc_res["hindi_summary"],
            action_items=doc_res["actions"],
            key_decisions=doc_res["decisions"],
            questions=doc_res["questions"],
            key_prefix="doc"
        )

        with st.expander("📄 Extracted Document Text", expanded=False):
            st.text_area("Source Text", doc_res["text"], height=250)
