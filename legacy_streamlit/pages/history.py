"""
Summary History Page
Displays all executive summaries and translations generated during the current session.
"""

import streamlit as st
import json
from frontend.components import render_header

def render_history_page():
    render_header(
        title="🕒 Summary History",
        subtitle="Review and export past summaries, translations, and extracted insights from this session.",
        badge="Session Archive"
    )

    history = st.session_state.get("summary_history", [])

    if not history:
        st.info("ℹ️ No summaries generated in this session yet. Summaries created in Video or Document Summarizer will appear here.")
        return

    st.markdown(f"Found **{len(history)}** summarized items in this session.")

    # Export All button
    col_exp1, col_exp2 = st.columns([1, 4])
    with col_exp1:
        history_json = json.dumps(history, indent=2)
        st.download_button(
            label="📥 Export All (JSON)",
            data=history_json,
            file_name="summary_history.json",
            mime="application/json",
            key="btn_export_all_hist"
        )
    with col_exp2:
        if st.button("🗑️ Clear History", key="btn_clear_history"):
            st.session_state["summary_history"] = []
            st.rerun()

    st.markdown("---")

    for i, item in enumerate(reversed(history)):
        idx = len(history) - i
        with st.expander(f"#{idx} — {item.get('title', item.get('name', 'Item'))} ({item.get('timestamp', '')})", expanded=(i == 0)):
            st.markdown(f"**Source Type:** `{item.get('source_type', 'N/A')}`")
            
            tab_e, tab_h, tab_act = st.tabs(["🇺🇸 English Summary", "🇮🇳 Hindi Translation", "🎯 Actions & Decisions"])
            with tab_e:
                st.markdown(item.get("english_summary", "No summary available."))
            with tab_h:
                st.markdown(item.get("hindi_summary", "No translation available."))
            with tab_act:
                st.markdown("#### Action Items")
                st.markdown(item.get("actions", "None"))
                st.markdown("#### Decisions")
                st.markdown(item.get("decisions", "None"))
