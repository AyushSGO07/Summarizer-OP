import os
from typing import List, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnableLambda
from core.llm_factory import get_llm

def split_transcript(transcript: str, chunk_size: int = 3500, chunk_overlap: int = 250) -> List[str]:
    """
    Splits long transcripts into manageable chunks for map-reduce summarization.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return splitter.split_text(transcript)

def summarise(transcription: str, llm_provider: Optional[str] = None) -> str:
    """
    Produces a comprehensive, professional executive meeting summary.
    If the transcript is short, uses an optimized single-pass summary.
    If long, uses an intelligent map-reduce pattern.
    """
    if not transcription or not transcription.strip():
        return "No transcript available to summarise."

    llm = get_llm(provider=llm_provider)

    # For short to medium transcripts, single-pass produces the most coherent summary
    if len(transcription.strip()) <= 4000:
        single_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an elite executive assistant and meeting analyst.\n"
                "Create a professional, structured meeting summary from the provided transcript.\n"
                "Include:\n"
                "1. **Executive Overview**: High-level purpose and key outcomes (2-3 sentences)\n"
                "2. **Primary Discussion Points**: Bullet points detailing major themes\n"
                "3. **Conclusions & Next Steps**: What the meeting concluded on"
            ),
            ("human", "Meeting Transcript:\n{text}")
        ])
        chain = single_prompt | llm | StrOutputParser()
        return chain.invoke({"text": transcription})

    # For long transcripts, perform Map-Reduce
    map_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert meeting analyst. Summarize this section of the meeting concisely, "
            "capturing key statements, data points, and context."
        ),
        ("human", "{text}")
    ])
    map_chain = map_prompt | llm | StrOutputParser()

    chunks = split_transcript(transcript=transcription)
    chunk_summaries = []
    for chunk in chunks:
        chunk_summary = map_chain.invoke({"text": chunk})
        chunk_summaries.append(chunk_summary)

    combined_text = "\n\n".join(chunk_summaries)

    combined_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an executive summary generator. Below are partial summaries from different segments "
            "of a meeting. Combine them into a cohesive, comprehensive, and professional meeting summary.\n"
            "Include:\n"
            "1. **Executive Overview**: Main theme and outcomes\n"
            "2. **Key Discussion Highlights**: Structured breakdown of topics\n"
            "3. **Conclusions**: Overall meeting wrap-up"
        ),
        ("human", "Segment Summaries:\n{text}")
    ])
    reduce_chain = combined_prompt | llm | StrOutputParser()
    return reduce_chain.invoke({"text": combined_text})

# Alias for standard spelling
summarize = summarise
