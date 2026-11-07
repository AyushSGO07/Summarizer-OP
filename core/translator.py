import os
from typing import Optional, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.llm_factory import get_llm

def split_text_for_translation(text: str, chunk_size: int = 3000, chunk_overlap: int = 150) -> List[str]:
    """
    Splits long text into manageable chunks for coherent translation.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return splitter.split_text(text)

def translate_to_hindi(text: str, llm_provider: Optional[str] = None) -> str:
    """
    Translates English summaries or document contents into natural, readable Hindi
    using an LCEL chain with Mistral AI (or the configured LLM provider).
    Preserves technical terminology, Markdown structure, and formatting.
    """
    if not text or not text.strip():
        return "अनुवाद के लिए कोई सामग्री उपलब्ध नहीं है।"

    llm = get_llm(provider=llm_provider, temperature=0.1)

    system_instruction = (
        "You are an expert bilingual English-to-Hindi translator.\n"
        "Translate the provided English text into natural, fluent, and professional Hindi.\n\n"
        "Important Guidelines:\n"
        "1. Maintain accurate meaning without mechanical or awkward word-for-word translation.\n"
        "2. Preserve all Markdown formatting including headings (###, ##), bold text, bullet points, and numbered lists.\n"
        "3. Keep technical terminology, product names, acronyms, and proper nouns in English or transliterated script "
        "(e.g., API, Database, RAG, ChromaDB, Backend, Frontend, Sprint, Token, Deploy, etc.).\n"
        "4. Output ONLY the translated Hindi content. Do NOT include any English preamble, alternatives, notes, or commentary."
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_instruction),
        ("human", "English text to translate into Hindi:\n\n{text}")
    ])

    chain = prompt | llm | StrOutputParser()

    # Short to medium texts: direct single-pass
    if len(text.strip()) <= 3500:
        return chain.invoke({"text": text.strip()}).strip()

    # Long text: chunk and translate
    chunks = split_text_for_translation(text.strip())
    translated_parts = []
    for chunk in chunks:
        part = chain.invoke({"text": chunk}).strip()
        translated_parts.append(part)

    return "\n\n".join(translated_parts).strip()
