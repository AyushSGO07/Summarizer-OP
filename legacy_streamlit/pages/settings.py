"""
Settings & Configuration Page
"""

import os
import shutil
import streamlit as st
from frontend.components import render_header

def render_settings_page():
    render_header(
        title="⚙️ Settings & Configuration",
        subtitle="Manage LLM providers, model parameters, RAG retrieval thresholds, and credentials status.",
        badge="System Preferences"
    )

    # 1. Credentials & Backend Status (Secure — No Key Exposure)
    st.markdown("### 🔐 Backend Engine Status")
    mistral_configured = bool(os.getenv("MISTRAL_API_KEY", "").strip())
    gemini_configured = bool(os.getenv("GEMINI_API_KEY", "").strip())
    ffmpeg_found = bool(shutil.which("ffmpeg"))

    c1, c2, c3 = st.columns(3)
    with c1:
        status_m = "🟢 Configured (Active)" if mistral_configured else "🔴 Missing in .env"
        st.markdown(f'<div class="glass-card"><b>Mistral AI API:</b><br>{status_m}</div>', unsafe_allow_html=True)
    with c2:
        status_g = "🟢 Configured (Fallback)" if gemini_configured else "⚪ Not Configured"
        st.markdown(f'<div class="glass-card"><b>Google Gemini API:</b><br>{status_g}</div>', unsafe_allow_html=True)
    with c3:
        status_ff = "🟢 Installed & Ready" if ffmpeg_found else "🟠 Not Found on PATH"
        st.markdown(f'<div class="glass-card"><b>FFmpeg Audio Engine:</b><br>{status_ff}</div>', unsafe_allow_html=True)

    st.markdown("---")

    # 2. LLM Engine Configuration
    st.markdown("### ⚡ LLM Configuration")
    col_p1, col_p2 = st.columns(2)

    with col_p1:
        current_provider = st.session_state.get("llm_provider", "mistral")
        selected_provider = st.selectbox(
            "Primary LLM Provider",
            options=["mistral", "gemini"],
            index=0 if current_provider == "mistral" else 1,
            help="Select the AI provider for summarization, translation, and RAG."
        )
        st.session_state["llm_provider"] = selected_provider

    with col_p2:
        if selected_provider == "mistral":
            models = ["ministral-8b-latest", "ministral-3b-latest", "codestral-latest", "mistral-small-latest"]
            curr_model = st.session_state.get("mistral_model", "ministral-8b-latest")
            idx = models.index(curr_model) if curr_model in models else 0
            sel_model = st.selectbox("Mistral Model", options=models, index=idx)
            st.session_state["mistral_model"] = sel_model
        else:
            models = ["gemini-3.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-pro"]
            curr_model = st.session_state.get("gemini_model", "gemini-3.5-flash-lite")
            idx = models.index(curr_model) if curr_model in models else 0
            sel_model = st.selectbox("Gemini Model", options=models, index=idx)
            st.session_state["gemini_model"] = sel_model

    # 3. RAG Retrieval Configuration
    st.markdown("### 🔍 RAG Vector Retrieval Settings")
    col_r1, col_r2 = st.columns(2)

    with col_r1:
        curr_k = st.session_state.get("rag_top_k", 4)
        sel_k = st.slider("Retrieved Context Chunks (Top-K)", min_value=1, max_value=8, value=curr_k)
        st.session_state["rag_top_k"] = sel_k

    with col_r2:
        st.info("Embedding Model: `all-MiniLM-L6-v2` via HuggingFace\nVector Store: `ChromaDB` (persistent directory `vector_db`)")

    st.success("✅ Preferences are automatically saved in the session.")
