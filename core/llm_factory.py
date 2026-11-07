import os
from typing import Optional
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

_DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
_DEFAULT_MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "ministral-8b-latest")

def get_llm(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    temperature: float = 0.2,
    streaming: bool = False,
    mistral_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None
):
    """
    Returns an instantiated LangChain Chat model.
    Prioritizes Mistral AI (or Gemini) based on availability and provider preference.
    Gracefully falls back if one provider hits quota/rate limits.
    Supports API keys passed dynamically per request or from server environment variables.
    """
    mistral_key = (mistral_api_key or os.getenv("MISTRAL_API_KEY", "")).strip()
    gemini_key = (gemini_api_key or os.getenv("GEMINI_API_KEY", "")).strip()

    # Determine default provider - prioritize Mistral for Mistral AI Summarizer
    if provider is None:
        default_pref = os.getenv("DEFAULT_LLM_PROVIDER", "mistral").strip().lower()
        if default_pref == "mistral" and mistral_key:
            provider = "mistral"
        elif default_pref in ("gemini", "google") and gemini_key:
            provider = "gemini"
        elif mistral_key:
            provider = "mistral"
        elif gemini_key:
            provider = "gemini"
        else:
            raise ValueError(
                "No AI API key found! Please configure your MISTRAL_API_KEY or GEMINI_API_KEY "
                "in Settings (or in your Vercel Project Dashboard under Settings -> Environment Variables)."
            )

    # Initialize Gemini
    if provider.lower() in ("gemini", "google"):
        if not gemini_key:
            if mistral_key:
                from langchain_mistralai import ChatMistralAI
                return ChatMistralAI(
                    model=_DEFAULT_MISTRAL_MODEL,
                    mistral_api_key=mistral_key,
                    temperature=temperature,
                    streaming=streaming,
                    timeout=30
                )
            raise ValueError("GEMINI_API_KEY not found. Please provide it in Settings or set it in Vercel Environment Variables.")
        
        from langchain_google_genai import ChatGoogleGenerativeAI
        selected_model = model_name or os.getenv("GEMINI_MODEL") or "gemini-3.5-flash-lite"
        gemini_chat = ChatGoogleGenerativeAI(
            model=selected_model,
            google_api_key=gemini_key,
            temperature=temperature,
            streaming=streaming
        )
        if mistral_key:
            from langchain_mistralai import ChatMistralAI
            fallback_chat = ChatMistralAI(
                model=_DEFAULT_MISTRAL_MODEL,
                mistral_api_key=mistral_key,
                temperature=temperature,
                streaming=streaming,
                timeout=10,
                max_retries=1
            )
            return gemini_chat.with_fallbacks([fallback_chat])
        return gemini_chat

    # Initialize Mistral
    elif provider.lower() == "mistral":
        if not mistral_key:
            if gemini_key:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model=_DEFAULT_GEMINI_MODEL,
                    google_api_key=gemini_key,
                    temperature=temperature,
                    streaming=streaming
                )
            raise ValueError("MISTRAL_API_KEY not found. Please provide it in Settings or set it in Vercel Environment Variables.")
        
        from langchain_mistralai import ChatMistralAI
        selected_model = model_name or _DEFAULT_MISTRAL_MODEL
        mistral_chat = ChatMistralAI(
            model=selected_model,
            mistral_api_key=mistral_key,
            temperature=temperature,
            streaming=streaming,
            timeout=10,
            max_retries=1
        )
        if gemini_key:
            from langchain_google_genai import ChatGoogleGenerativeAI
            fallback_chat = ChatGoogleGenerativeAI(
                model=_DEFAULT_GEMINI_MODEL,
                google_api_key=gemini_key,
                temperature=temperature,
                streaming=streaming
            )
            return mistral_chat.with_fallbacks([fallback_chat])
        return mistral_chat

    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
