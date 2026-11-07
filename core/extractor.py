import os
from typing import Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from core.llm_factory import get_llm

def build_chain(
    system_prompt: str,
    llm_provider: Optional[str] = None,
    mistral_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None
):
    """
    Builds a robust extraction chain.
    """
    llm = get_llm(
        provider=llm_provider,
        mistral_api_key=mistral_api_key,
        gemini_api_key=gemini_api_key
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{text}")
    ])
    return (
        RunnableLambda(lambda x: {"text": x})
        | prompt
        | llm
        | StrOutputParser()
    )

def extract_action_items(
    transcript: str,
    llm_provider: Optional[str] = None,
    mistral_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None
) -> str:
    """
    Extracts action items, owners, deadlines, and priorities from the transcript.
    """
    if not transcript or not transcript.strip():
        return "No transcript provided."

    chain = build_chain(
        "You are an expert executive meeting analyst.\n"
        "Extract all actionable tasks and action items from the meeting transcript.\n"
        "For each action item, format clearly with:\n"
        "- Task Description: What needs to be done\n"
        "- Owner / Responsible: Who is assigned (if not mentioned, state 'Not specified')\n"
        "- Deadline / Timeline: When it is due (if not mentioned, state 'Not specified')\n"
        "- Priority: (High / Medium / Low based on meeting context)\n\n"
        "Format as a numbered markdown list. If no action items are found, respond with 'No action items found in the meeting.'",
        llm_provider=llm_provider,
        mistral_api_key=mistral_api_key,
        gemini_api_key=gemini_api_key
    )
    return chain.invoke(transcript)

def extract_key_decisions(
    transcript: str,
    llm_provider: Optional[str] = None,
    mistral_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None
) -> str:
    """
    Extracts all major decisions agreed upon during the meeting.
    """
    if not transcript or not transcript.strip():
        return "No transcript provided."

    chain = build_chain(
        "You are an expert executive meeting analyst.\n"
        "Extract all key decisions, agreements, and consensus reached in the meeting transcript.\n"
        "For each decision, explain:\n"
        "- The decision reached\n"
        "- The rationale or context behind it (if discussed)\n\n"
        "Format as a numbered markdown list. If no clear decisions were made, respond with 'No key decisions recorded in the meeting.'",
        llm_provider=llm_provider,
        mistral_api_key=mistral_api_key,
        gemini_api_key=gemini_api_key
    )
    return chain.invoke(transcript)

def extract_questions(
    transcript: str,
    llm_provider: Optional[str] = None,
    mistral_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None
) -> str:
    """
    Extracts unresolved questions, blockers, and topics needing follow-up.
    """
    if not transcript or not transcript.strip():
        return "No transcript provided."

    chain = build_chain(
        "You are an expert meeting analyst.\n"
        "Extract all unresolved questions, doubts, blockers, or topics flagged for future follow-up from the transcript.\n"
        "For each item, specify:\n"
        "- The open question / concern\n"
        "- Who raised it or is expected to resolve it (if mentioned)\n\n"
        "Format as a numbered markdown list. If none are found, respond with 'No unresolved questions found.'",
        llm_provider=llm_provider,
        mistral_api_key=mistral_api_key,
        gemini_api_key=gemini_api_key
    )
    return chain.invoke(transcript)

# Backward compatibility alias for the typo in original code
extractquestons = extract_questions

def extract_all(
    transcript: str,
    llm_provider: Optional[str] = None,
    mistral_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None
) -> Dict[str, str]:
    """
    Convenience method to extract all key meeting intelligence facets.
    """
    return {
        "action_items": extract_action_items(transcript, llm_provider=llm_provider, mistral_api_key=mistral_api_key, gemini_api_key=gemini_api_key),
        "key_decisions": extract_key_decisions(transcript, llm_provider=llm_provider, mistral_api_key=mistral_api_key, gemini_api_key=gemini_api_key),
        "unresolved_questions": extract_questions(transcript, llm_provider=llm_provider, mistral_api_key=mistral_api_key, gemini_api_key=gemini_api_key)
    }
