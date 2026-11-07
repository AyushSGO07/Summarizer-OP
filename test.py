"""
Test Script for AI Meeting & Content Intelligence Agent
Demonstrates the full pipeline: Ingestion, Extraction, Summarization, and RAG.
"""

from utils.audio_processor import ingest_source
from core.summarise import summarise
from core.extractor import extract_action_items, extract_key_decisions, extractquestons
from core.vector_store import build_vector_store
from core.rag_engine import ask_rag, generate_suggested_questions

def main():
    print("=" * 60)
    print("🤖 AI AGENT PIPELINE TEST")
    print("=" * 60)

    # You can test with a YouTube URL, audio file, or direct sample text
    sample_meeting = """
    Sprint Planning Meeting - Nova Project
    Date: November 7, 2026
    Attendees: Alice (Product Manager), Bob (Backend Dev), Clara (Frontend Dev)

    Alice: Welcome team. Our goal for Sprint 42 is delivering the AI RAG search interface.
    Bob: I have already configured ChromaDB and embeddings. The backend API handles queries in under 200ms.
    Clara: On the frontend, Streamlit UI has tabs for Chat, Executive Summary, Action Items, and Transcript search.
    Alice: Excellent. Bob, your action item is to deploy the API to production by Wednesday 5 PM.
    Clara: Your action item is to finalize the responsive styling and citation cards by Thursday noon.
    Bob: We decided that all API endpoints must require bearer token authentication.
    Clara: Question: Will we support dark mode toggling in this sprint?
    Alice: Let's defer dark mode to Sprint 43.
    """

    print("\n1. Ingesting Meeting Content...")
    # Ingest source (supports raw text, YouTube URLs, documents, or media files)
    data = ingest_source(sample_meeting)
    transcript = data["text"]
    print(f"Ingested text ({len(transcript)} chars). Source type: {data['source_type']}")

    print("\n2. Generating Executive Summary...")
    summary = summarise(transcript)
    print(summary)

    print("\n3. Extracting Action Items...")
    actions = extract_action_items(transcript)
    print(actions)

    print("\n4. Extracting Key Decisions...")
    decisions = extract_key_decisions(transcript)
    print(decisions)

    print("\n5. Extracting Questions & Blocker Topics...")
    questions = extractquestons(transcript)
    print(questions)

    print("\n6. Indexing into Vector Store (ChromaDB)...")
    vs = build_vector_store(transcript, collection_name="test_nova_sprint")

    print("\n7. Testing Conversational RAG Query...")
    query = "What is Bob's action item and what is the deadline?"
    result = ask_rag(query, vector_store=vs)
    print(f"\nUser Query: {query}")
    print(f"RAG Answer:\n{result['answer']}")
    print(f"Retrieved Source Chunks: {result['retrieved_count']}")

    print("\n8. Suggested Follow-Up Questions:")
    suggested = generate_suggested_questions(transcript)
    for q in suggested:
        print(f" - {q}")

    print("\n" + "=" * 60)
    print("✅ All AI Agent pipeline tests completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
