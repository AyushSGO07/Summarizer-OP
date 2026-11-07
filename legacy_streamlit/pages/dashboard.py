"""
Dashboard Landing Page
"""

import streamlit as st
from frontend.components import render_header

def render_dashboard_page():
    render_header(
        title='Understand More. <span class="gradient-text">Read Less.</span>',
        subtitle="Summarize videos and documents, translate insights into Hindi, and interact with your knowledge using AI.",
        badge="Mistral AI Summarizer v2.0"
    )

    # Status Pill Row
    provider = st.session_state.get("llm_provider", "mistral")
    model = st.session_state.get("mistral_model", "ministral-8b-latest")
    st.markdown(
        f"""
        <div style="display: flex; gap: 0.8rem; margin-bottom: 2rem; flex-wrap: wrap;">
            <div class="status-pill status-purple">⚡ Engine: <b>{provider.upper()} ({model})</b></div>
            <div class="status-pill status-active">● Embeddings: <b>all-MiniLM-L6-v2</b></div>
            <div class="status-pill status-purple">🌐 Multilingual: <b>English & Hindi</b></div>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.markdown("### Core Capabilities")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown(
            """
            <div class="feature-card">
                <div>
                    <div style="font-size: 2.2rem; margin-bottom: 0.75rem;">🎬</div>
                    <h3 style="margin-bottom: 0.4rem; font-weight: 700;">Video Summarization</h3>
                    <p style="color: #94A3B8; font-size: 0.9rem; line-height: 1.5;">
                        Process YouTube URLs, extract video transcripts, generate executive summaries, and produce fluent Hindi translations in seconds.
                    </p>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
        if st.button("Open Video Summarizer →", key="btn_goto_video", use_container_width=True):
            st.session_state["nav_selection"] = "Video Summarizer"
            st.rerun()

    with col2:
        st.markdown(
            """
            <div class="feature-card">
                <div>
                    <div style="font-size: 2.2rem; margin-bottom: 0.75rem;">📄</div>
                    <h3 style="margin-bottom: 0.4rem; font-weight: 700;">Document Summarizer</h3>
                    <p style="color: #94A3B8; font-size: 0.9rem; line-height: 1.5;">
                        Upload PDFs, Word docs, Markdown, or text files. Extract structured action items, major decisions, and Hindi summaries.
                    </p>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
        if st.button("Open Document Summarizer →", key="btn_goto_doc", use_container_width=True):
            st.session_state["nav_selection"] = "Document Summarizer"
            st.rerun()

    with col3:
        st.markdown(
            """
            <div class="feature-card">
                <div>
                    <div style="font-size: 2.2rem; margin-bottom: 0.75rem;">💬</div>
                    <h3 style="margin-bottom: 0.4rem; font-weight: 700;">AI Document Chat</h3>
                    <p style="color: #94A3B8; font-size: 0.9rem; line-height: 1.5;">
                        Chat interactively with uploaded documents using grounded ChromaDB vector search and LangChain RAG pipeline with citations.
                    </p>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
        if st.button("Ask Your Documents →", key="btn_goto_rag", use_container_width=True):
            st.session_state["nav_selection"] = "Ask Your Documents"
            st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)

    # Session Activity Highlights
    history = st.session_state.get("summary_history", [])
    st.markdown("### ⚡ Quick Session Stats")
    scol1, scol2, scol3 = st.columns(3)
    with scol1:
        st.metric("Summaries Generated", len(history))
    with scol2:
        active_doc = st.session_state.get("active_document_name", "None")
        st.metric("Active RAG Document", active_doc if active_doc else "None")
    with scol3:
        chunks_indexed = st.session_state.get("active_chunks_count", 0)
        st.metric("ChromaDB Chunks Indexed", chunks_indexed)
