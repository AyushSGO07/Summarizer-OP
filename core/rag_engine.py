import os
from typing import List, Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.documents import Document

from core.llm_factory import get_llm
from core.vector_store import (
    build_vector_store,
    load_vector_store,
    get_retriever,
    get_retiever,
    CHROMA_DIR,
    COLLECTION_NAME
)

def format_docs(docs: List[Document]) -> str:
    """
    Formats retrieved documents into clean string context.
    Fixed typo: doc.page_content instead of docs.page_content.
    """
    if not docs:
        return "No relevant context found."
    return "\n\n".join([doc.page_content.strip() for doc in docs])

def format_docs_with_sources(docs: List[Document]) -> str:
    """
    Formats retrieved documents with chunk indexing for transparent source attribution.
    """
    if not docs:
        return "No relevant context found."
    formatted = []
    for i, doc in enumerate(docs, 1):
        chunk_idx = doc.metadata.get("chunk_index", i - 1)
        formatted.append(f"[Source Segment {i} | Chunk #{chunk_idx}]:\n{doc.page_content.strip()}")
    return "\n\n".join(formatted)

def build_rag_prompt() -> ChatPromptTemplate:
    """
    Constructs an expert RAG system prompt with context grounding.
    """
    return ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert AI Meeting & Document Intelligence Assistant.\n"
            "Your job is to answer the user's questions accurately and concisely based ONLY on the provided context.\n\n"
            "Guidelines:\n"
            "1. Answer using ONLY facts directly mentioned in the Context. Do not fabricate or assume.\n"
            "2. If the context does not contain enough information to answer, state clearly:\n"
            "   'I could not find information regarding that in the meeting transcript/document.'\n"
            "3. Be concise, well-structured (use bullet points when appropriate), and professional.\n"
            "4. When relevant, reference the key speakers, topics, or action items from the context.\n\n"
            "Context:\n{context}"
        ),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("human", "{question}")
    ])

def build_rag_chain(
    transcript: str,
    collection_name: str = COLLECTION_NAME,
    persist_directory: str = CHROMA_DIR,
    k: int = 4,
    llm_provider: Optional[str] = None
):
    """
    Builds a vector store from transcript and returns an executable RAG chain.
    """
    vector_store = build_vector_store(
        transcript=transcript,
        collection_name=collection_name,
        persist_directory=persist_directory
    )
    retriever = get_retriever(vector_store, k=k)
    llm = get_llm(provider=llm_provider)
    prompt = build_rag_prompt()

    rag_chain = (
        {
            "context": retriever | RunnableLambda(format_docs_with_sources),
            "question": RunnablePassthrough(),
            "chat_history": RunnableLambda(lambda _: [])
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain

def load_rag_chain(
    collection_name: str = COLLECTION_NAME,
    persist_directory: str = CHROMA_DIR,
    k: int = 4,
    llm_provider: Optional[str] = None,
    mistral_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None
):
    """
    Loads an existing vector store and returns a ready-to-use RAG chain.
    """
    vector_store = load_vector_store(
        collection_name=collection_name,
        persist_directory=persist_directory
    )
    retriever = get_retriever(vector_store, k=k)
    llm = get_llm(
        provider=llm_provider,
        mistral_api_key=mistral_api_key,
        gemini_api_key=gemini_api_key
    )
    prompt = build_rag_prompt()

    rag_chain = (
        {
            "context": retriever | RunnableLambda(format_docs_with_sources),
            "question": RunnablePassthrough(),
            "chat_history": RunnableLambda(lambda _: [])
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain

def ask_rag(
    query: str,
    vector_store=None,
    collection_name: str = COLLECTION_NAME,
    persist_directory: str = CHROMA_DIR,
    chat_history: Optional[List[Dict[str, str]]] = None,
    k: int = 4,
    llm_provider: Optional[str] = None,
    mistral_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    End-to-end question answering against the vector store with citation details.
    
    Returns:
        dict: {
            "answer": str,
            "sources": list of dicts with content and metadata,
            "retrieved_count": int
        }
    """
    if vector_store is None:
        vector_store = load_vector_store(collection_name, persist_directory)

    retriever = get_retriever(vector_store, k=k)
    docs = retriever.invoke(query)
    context_str = format_docs_with_sources(docs)

    # Format chat history for prompt
    formatted_history = []
    if chat_history:
        for msg in chat_history[-6:]:  # Keep recent context
            role = msg.get("role", "human")
            content = msg.get("content", "")
            if role == "assistant":
                formatted_history.append(("ai", content))
            else:
                formatted_history.append(("human", content))

    prompt = build_rag_prompt()
    llm = get_llm(
        provider=llm_provider,
        mistral_api_key=mistral_api_key,
        gemini_api_key=gemini_api_key
    )
    chain = prompt | llm | StrOutputParser()

    answer = chain.invoke({
        "context": context_str,
        "question": query,
        "chat_history": formatted_history
    })

    sources = [
        {
            "chunk_index": d.metadata.get("chunk_index", idx),
            "content": d.page_content,
            "metadata": d.metadata
        }
        for idx, d in enumerate(docs)
    ]

    return {
        "answer": answer.strip() if isinstance(answer, str) else str(answer),
        "sources": sources,
        "retrieved_count": len(docs)
    }

def generate_suggested_questions(transcript: str, num_questions: int = 4) -> List[str]:
    """
    Generates intelligent sample questions based on the meeting transcript.
    """
    if not transcript or len(transcript.strip()) < 50:
        return [
            "What were the key takeaways from this meeting?",
            "What action items were assigned?",
            "What decisions were agreed upon?",
            "Who are the main participants and their roles?"
        ]

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an AI meeting analyst. Review the transcript snippet below and suggest 4 brief, "
            "insightful questions that someone reviewing this meeting would ask. "
            "Output each question on a new line without numbering or bullet points."
        ),
        ("human", "Transcript Snippet:\n{transcript_sample}")
    ])
    llm = get_llm()
    chain = prompt | llm | StrOutputParser()

    # Pass the first ~2500 characters
    sample = transcript[:2500]
    try:
        raw_output = chain.invoke({"transcript_sample": sample})
        lines = [line.strip().lstrip("-*0123456789. ") for line in raw_output.split("\n") if line.strip()]
        return lines[:num_questions] if lines else [
            "What was the primary goal discussed?",
            "What are the urgent deadlines?",
            "Who owns which deliverable?",
            "What were the main blockers raised?"
        ]
    except Exception as e:
        print(f"[RAG] Question suggestion error: {e}")
        return [
            "What were the key takeaways from this meeting?",
            "What action items were assigned?",
            "What decisions were agreed upon?",
            "What are the next steps?"
        ]
