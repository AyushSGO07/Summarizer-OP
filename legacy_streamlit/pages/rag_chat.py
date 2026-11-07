"""
RAG — Ask Your Documents Page
Dedicated conversational interface for querying documents using ChromaDB vector store
and LangChain RAG pipeline with grounded citations and conversation history.
"""

import os
import tempfile
import streamlit as st
from frontend.components import render_header, render_source_cards
from utils.audio_processor import ingest_source
from core.vector_store import build_vector_store, load_vector_store
from core.rag_engine import ask_rag, generate_suggested_questions

def render_rag_chat_page():
    render_header(
        title="💬 Ask Your Documents",
        subtitle="Chat conversationally with your documents using grounded ChromaDB vector search and citations.",
        badge="Retrieval-Augmented Generation"
    )

    # Initialize RAG Session State
    if "rag_messages" not in st.session_state:
        st.session_state["rag_messages"] = []
    if "active_vector_store" not in st.session_state:
        st.session_state["active_vector_store"] = None
    if "active_document_name" not in st.session_state:
        st.session_state["active_document_name"] = None
    if "active_document_text" not in st.session_state:
        st.session_state["active_document_text"] = None
    if "suggested_questions" not in st.session_state:
        st.session_state["suggested_questions"] = []

    # Document Selection & Indexing Panel
    with st.expander("📁 Document & Knowledge Base Management", expanded=st.session_state["active_vector_store"] is None):
        tab_select, tab_upload = st.tabs(["📌 Active Knowledge Base", "📤 Index New Document"])

        with tab_select:
            curr_doc = st.session_state.get("active_document_name")
            if curr_doc:
                st.success(f"🟢 **Active Indexed Document:** {curr_doc}")
                chunks = st.session_state.get("active_chunks_count", 0)
                st.caption(f"Vector Store: ChromaDB | Embeddings: all-MiniLM-L6-v2 | Indexed Chunks: {chunks}")
            else:
                st.info("ℹ️ No document currently indexed. Please upload or index a document below.")

            # Option to load existing ChromaDB collection from disk if it exists
            col_l1, col_l2 = st.columns([2, 1])
            with col_l1:
                if os.path.exists("vector_db") and st.button("🔄 Reload Existing ChromaDB Store", key="btn_reload_chroma"):
                    try:
                        vs = load_vector_store(collection_name="meeting_transcript")
                        st.session_state["active_vector_store"] = vs
                        st.session_state["active_document_name"] = "Persistent ChromaDB Store"
                        st.success("Successfully loaded ChromaDB collection!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Failed to load vector store: {e}")

        with tab_upload:
            uploaded_rag_file = st.file_uploader(
                "Upload document for RAG indexing",
                type=["pdf", "docx", "txt", "md", "csv"],
                key="rag_uploader"
            )

            if uploaded_rag_file is not None:
                if st.button("Index Document into ChromaDB", key="btn_index_rag"):
                    temp_path = None
                    with st.spinner("Extracting text and generating embeddings..."):
                        try:
                            suffix = os.path.splitext(uploaded_rag_file.name)[1]
                            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                                tmp.write(uploaded_rag_file.getvalue())
                                temp_path = tmp.name

                            ingested = ingest_source(temp_path)
                            text = ingested.get("text", "").strip()

                            if not text:
                                raise ValueError("Could not extract readable text from document.")

                            # Build ChromaDB Vector Store
                            vs = build_vector_store(text, collection_name="meeting_transcript")
                            st.session_state["active_vector_store"] = vs
                            st.session_state["active_document_name"] = uploaded_rag_file.name
                            st.session_state["active_document_text"] = text
                            st.session_state["active_chunks_count"] = max(1, len(text) // 600)

                            # Generate suggested follow-up questions
                            try:
                                suggestions = generate_suggested_questions(text, num_questions=4)
                                st.session_state["suggested_questions"] = suggestions
                            except Exception:
                                st.session_state["suggested_questions"] = []

                            st.session_state["rag_messages"] = [
                                {
                                    "role": "assistant",
                                    "content": f"I have indexed **{uploaded_rag_file.name}** into ChromaDB. Ask me anything about its contents!"
                                }
                            ]
                            st.success(f"✅ Indexed '{uploaded_rag_file.name}' into ChromaDB!")
                            st.rerun()

                        except Exception as e:
                            st.error(f"Indexing error: {e}")
                        finally:
                            if temp_path and os.path.exists(temp_path):
                                try:
                                    os.remove(temp_path)
                                except Exception:
                                    pass

    # Suggested Questions Prompt Chips
    if st.session_state.get("suggested_questions"):
        st.markdown("<p style='color: #94A3B8; font-size: 0.85rem; margin-bottom: 0.4rem;'>💡 Suggested Questions:</p>", unsafe_allow_html=True)
        sq_cols = st.columns(len(st.session_state["suggested_questions"]))
        for i, q in enumerate(st.session_state["suggested_questions"]):
            with sq_cols[i]:
                if st.button(f"👉 {q[:45]}...", key=f"sq_btn_{i}", help=q, use_container_width=True):
                    st.session_state["preset_query"] = q
                    st.rerun()

    st.markdown("---")

    # Render Chat History
    for msg in st.session_state["rag_messages"]:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if "sources" in msg and msg["sources"]:
                render_source_cards(msg["sources"])

    # Chat Input
    preset_val = st.session_state.pop("preset_query", None)
    user_query = st.chat_input("Ask a question about the indexed document...", key="chat_input")
    query_to_run = preset_val or user_query

    if query_to_run:
        if not st.session_state.get("active_vector_store"):
            st.warning("⚠️ Please index or upload a document first before asking questions.")
            return

        # Add user query to chat
        st.session_state["rag_messages"].append({"role": "user", "content": query_to_run})
        with st.chat_message("user"):
            st.markdown(query_to_run)

        # Generate grounded RAG response
        with st.chat_message("assistant"):
            with st.spinner("Searching document chunks with ChromaDB and generating answer..."):
                try:
                    vs = st.session_state["active_vector_store"]
                    provider = st.session_state.get("llm_provider", "mistral")
                    top_k = st.session_state.get("rag_top_k", 4)

                    # Prepare conversation history
                    history_payload = [
                        {"role": m["role"], "content": m["content"]}
                        for m in st.session_state["rag_messages"][:-1]
                    ]

                    rag_res = ask_rag(
                        query=query_to_run,
                        vector_store=vs,
                        chat_history=history_payload,
                        k=top_k,
                        llm_provider=provider
                    )

                    answer = rag_res.get("answer", "No answer generated.")
                    sources = rag_res.get("sources", [])

                    st.markdown(answer)
                    if sources:
                        render_source_cards(sources)

                    # Store in chat history
                    st.session_state["rag_messages"].append({
                        "role": "assistant",
                        "content": answer,
                        "sources": sources
                    })

                except Exception as e:
                    err_msg = f"Error during retrieval: {str(e)}"
                    st.error(err_msg)
                    st.session_state["rag_messages"].append({
                        "role": "assistant",
                        "content": err_msg
                    })

    # Clear Chat Action
    if len(st.session_state["rag_messages"]) > 1:
        if st.button("🗑️ Clear Chat History", key="btn_clear_chat"):
            st.session_state["rag_messages"] = []
            st.rerun()
