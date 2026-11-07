"""
Reusable UI Components for Mistral AI Summarizer
"""

import streamlit as st
from typing import List, Dict, Any, Optional

def render_header(title: str, subtitle: Optional[str] = None, badge: Optional[str] = None):
    """Renders a consistent, modern page header with optional gradient and badge."""
    if badge:
        st.markdown(f'<div class="brand-badge">{badge}</div>', unsafe_allow_html=True)
    st.markdown(f'<h1 style="font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.3rem;">{title}</h1>', unsafe_allow_html=True)
    if subtitle:
        st.markdown(f'<p style="color: #94A3B8; font-size: 1.05rem; margin-bottom: 1.5rem;">{subtitle}</p>', unsafe_allow_html=True)

def render_status_pill(text: str, pill_type: str = "purple"):
    """Renders a status pill (active, purple, info)."""
    cls = f"status-pill status-{pill_type}"
    st.markdown(f'<span class="{cls}">● {text}</span>', unsafe_allow_html=True)

def render_metric_cards(metrics: List[Dict[str, str]]):
    """
    Renders a row of clean metric summary cards.
    metrics = [{"label": "Source", "value": "YouTube"}, ...]
    """
    cols = st.columns(len(metrics))
    for col, m in zip(cols, metrics):
        with col:
            st.metric(label=m.get("label", ""), value=m.get("value", ""), delta=m.get("delta"))

def render_source_cards(sources: List[Dict[str, Any]]):
    """
    Renders retrieved context chunks for RAG transparency.
    """
    if not sources:
        st.info("No explicit source chunks retrieved.")
        return

    st.markdown(f"<p style='color: #A855F7; font-weight: 600; font-size: 0.9rem; margin-top: 0.8rem;'>📚 Retrieved Source Chunks ({len(sources)}):</p>", unsafe_allow_html=True)
    for idx, src in enumerate(sources, 1):
        chunk_idx = src.get("chunk_index", idx)
        content = src.get("content", "").strip()
        with st.expander(f"Source Segment #{idx} — Chunk {chunk_idx}", expanded=False):
            st.markdown(f'<div class="citation-box">{content}</div>', unsafe_allow_html=True)
            meta = src.get("metadata", {})
            if meta:
                st.caption(f"Metadata: {meta}")

def render_bilingual_summary(
    english_summary: str,
    hindi_summary: str,
    action_items: Optional[str] = None,
    key_decisions: Optional[str] = None,
    questions: Optional[str] = None,
    key_prefix: str = "sum"
):
    """
    Presents English Summary and Hindi Translation in clear, beautifully formatted sections
    with copy buttons and optional action items tabs.
    """
    st.markdown("### 📋 Executive Intelligence")
    
    tab_eng, tab_hin, tab_insights = st.tabs(["🇺🇸 English Summary", "🇮🇳 Hindi Translation (हिंदी अनुवाद)", "💡 Key Insights & Actions"])

    with tab_eng:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown(english_summary)
        st.markdown('</div>', unsafe_allow_html=True)
        col1, col2 = st.columns([1, 4])
        with col1:
            st.download_button(
                label="📥 Download English (MD)",
                data=english_summary,
                file_name="english_summary.md",
                mime="text/markdown",
                key=f"{key_prefix}_dl_eng"
            )
        with col2:
            with st.expander("📄 View raw text / Copy code"):
                st.code(english_summary, language="markdown")

    with tab_hin:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown(hindi_summary)
        st.markdown('</div>', unsafe_allow_html=True)
        col1, col2 = st.columns([1, 4])
        with col1:
            st.download_button(
                label="📥 Download Hindi (MD)",
                data=hindi_summary,
                file_name="hindi_summary.md",
                mime="text/markdown",
                key=f"{key_prefix}_dl_hin"
            )
        with col2:
            with st.expander("📄 View raw Hindi text / Copy code"):
                st.code(hindi_summary, language="markdown")

    with tab_insights:
        if action_items or key_decisions or questions:
            if action_items:
                st.markdown("#### 🎯 Action Items & Assigned Tasks")
                st.markdown(action_items)
                st.markdown("---")
            if key_decisions:
                st.markdown("#### ⚖️ Key Decisions Made")
                st.markdown(key_decisions)
                st.markdown("---")
            if questions:
                st.markdown("#### ❓ Open Questions & Next Steps")
                st.markdown(questions)
        else:
            st.info("No additional structured facets extracted.")
