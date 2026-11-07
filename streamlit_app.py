"""
Mistral AI Summarizer — Application Entry Point
Clean, modular orchestration integrating Mistral AI, LangChain LCEL, ChromaDB, HuggingFace embeddings,
and a modern dark SaaS dashboard.
"""

import os
import streamlit as st
from dotenv import load_dotenv

# 1. Load Environment Configuration
load_dotenv()

# 2. Configure Streamlit Page
st.set_page_config(
    page_title="Mistral AI Summarizer",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 3. Inject Premium SaaS Styles
from frontend.styles import inject_custom_styles
st.markdown(inject_custom_styles(), unsafe_allow_html=True)

# 4. Initialize Session State
if "nav_selection" not in st.session_state:
    st.session_state["nav_selection"] = "Dashboard"

if "llm_provider" not in st.session_state:
    st.session_state["llm_provider"] = "mistral"

if "mistral_model" not in st.session_state:
    st.session_state["mistral_model"] = os.getenv("MISTRAL_MODEL", "ministral-8b-latest")

if "gemini_model" not in st.session_state:
    st.session_state["gemini_model"] = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

if "rag_top_k" not in st.session_state:
    st.session_state["rag_top_k"] = 4

if "summary_history" not in st.session_state:
    st.session_state["summary_history"] = []

if "active_vector_store" not in st.session_state:
    st.session_state["active_vector_store"] = None

if "active_document_name" not in st.session_state:
    st.session_state["active_document_name"] = None

if "active_document_text" not in st.session_state:
    st.session_state["active_document_text"] = None

if "active_chunks_count" not in st.session_state:
    st.session_state["active_chunks_count"] = 0

# Sync environment variable with session preference
if st.session_state["llm_provider"] == "mistral":
    os.environ["MISTRAL_MODEL"] = st.session_state["mistral_model"]
else:
    os.environ["GEMINI_MODEL"] = st.session_state["gemini_model"]

# 5. Modular Page Imports
from frontend.pages.dashboard import render_dashboard_page
from frontend.pages.video_summarizer import render_video_summarizer_page
from frontend.pages.document_summarizer import render_document_summarizer_page
from frontend.pages.rag_chat import render_rag_chat_page
from frontend.pages.history import render_history_page
from frontend.pages.settings import render_settings_page

# 6. Sidebar Navigation
with st.sidebar:
    st.markdown(
        """
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-top: 0.5rem;">
            <div style="background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);">
                ⚡
            </div>
            <div>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; color: #FFFFFF;">Mistral AI</h3>
                <span style="font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em;">Summarizer & RAG</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.markdown('<div class="nav-header">Navigation</div>', unsafe_allow_html=True)
    
    pages = [
        "Dashboard",
        "Video Summarizer",
        "Document Summarizer",
        "Ask Your Documents",
        "Summary History",
        "Settings"
    ]

    icons = {
        "Dashboard": "🏠",
        "Video Summarizer": "🎬",
        "Document Summarizer": "📄",
        "Ask Your Documents": "💬",
        "Summary History": "🕒",
        "Settings": "⚙️"
    }

    current_idx = pages.index(st.session_state["nav_selection"]) if st.session_state["nav_selection"] in pages else 0

    selected_page = st.radio(
        "Navigation",
        options=pages,
        index=current_idx,
        format_func=lambda p: f"{icons.get(p, '•')}  {p}",
        label_visibility="collapsed"
    )

    if selected_page != st.session_state["nav_selection"]:
        st.session_state["nav_selection"] = selected_page
        st.rerun()

    st.markdown("---")
    
    # Active System Status in Sidebar
    provider = st.session_state.get("llm_provider", "mistral")
    model = st.session_state.get("mistral_model", "ministral-8b-latest") if provider == "mistral" else st.session_state.get("gemini_model", "gemini-3.5-flash-lite")
    active_doc = st.session_state.get("active_document_name")

    st.markdown('<div class="nav-header">System Health</div>', unsafe_allow_html=True)
    st.markdown(
        f"""
        <div style="font-size: 0.8rem; line-height: 1.8; color: #94A3B8;">
            <div>● LLM: <b style="color: #DDD6FE;">{provider.title()}</b> ({model[:14]}...)</div>
            <div>● Embeddings: <b style="color: #34D399;">HuggingFace</b></div>
            <div>● Vector DB: <b style="color: #60A5FA;">ChromaDB</b></div>
            <div>● RAG Target: <b style="color: #F8FAFC;">{active_doc[:15] + '...' if active_doc and len(active_doc) > 15 else (active_doc or 'None')}</b></div>
        </div>
        """,
        unsafe_allow_html=True
    )

# 7. Router
page = st.session_state["nav_selection"]

if page == "Dashboard":
    render_dashboard_page()
elif page == "Video Summarizer":
    render_video_summarizer_page()
elif page == "Document Summarizer":
    render_document_summarizer_page()
elif page == "Ask Your Documents":
    render_rag_chat_page()
elif page == "Summary History":
    render_history_page()
elif page == "Settings":
    render_settings_page()
