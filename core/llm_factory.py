import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Ensure environment variables are loaded from root .env if present
load_dotenv()

def get_env_key(*names: str) -> str:
    """
    Looks up environment variables by multiple aliases and case-insensitively at runtime.
    Supports MISTRAL_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY, etc.
    """
    for name in names:
        val = os.getenv(name)
        if val and val.strip():
            return val.strip()
        for k, v in os.environ.items():
            if k.lower() == name.lower() and v and v.strip():
                return v.strip()
    return ""

def is_mistral_configured() -> bool:
    """Returns True if Mistral API key is configured in the environment."""
    return bool(get_env_key("MISTRAL_API_KEY", "MISTRALAI_API_KEY", "MISTRAL_KEY"))

def is_gemini_configured() -> bool:
    """Returns True if Gemini API key is configured in the environment."""
    return bool(get_env_key("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY", "GEMINI_KEY"))

def get_active_provider_info(preferred_provider: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns safe metadata regarding configured providers and the effective active provider.
    Never exposes key values.
    """
    mistral_ready = is_mistral_configured()
    gemini_ready = is_gemini_configured()

    pref = (preferred_provider or os.getenv("DEFAULT_LLM_PROVIDER", "mistral")).strip().lower()
    if pref in ("gemini", "google"):
        effective = "gemini" if gemini_ready else ("mistral" if mistral_ready else "gemini")
    else:
        effective = "mistral" if mistral_ready else ("gemini" if gemini_ready else "mistral")

    return {
        "preferred_provider": pref,
        "effective_provider": effective,
        "mistral_configured": mistral_ready,
        "gemini_configured": gemini_ready,
        "has_any_configured": mistral_ready or gemini_ready,
        "default_mistral_model": get_env_key("MISTRAL_MODEL") or "ministral-8b-latest",
        "default_gemini_model": get_env_key("GEMINI_MODEL") or "gemini-3.5-flash-lite"
    }

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
    Prioritizes Mistral AI as the primary provider and Google Gemini as the fallback provider.
    Seamlessly falls back if one provider hits quota or is unconfigured.
    Always reads credentials securely from server-side environment variables.
    """
    mistral_key = (
        mistral_api_key or
        get_env_key("MISTRAL_API_KEY", "MISTRALAI_API_KEY", "MISTRAL_KEY")
    ).strip()

    gemini_key = (
        gemini_api_key or
        get_env_key("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY", "GEMINI_KEY")
    ).strip()

    default_mistral_model = get_env_key("MISTRAL_MODEL") or "ministral-8b-latest"
    default_gemini_model = get_env_key("GEMINI_MODEL") or "gemini-3.5-flash-lite"

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
                "No AI API key found! Please configure MISTRAL_API_KEY or GEMINI_API_KEY "
                "in your server environment variables."
            )

    # Initialize Gemini
    if provider.lower() in ("gemini", "google"):
        if not gemini_key:
            if mistral_key:
                from langchain_mistralai import ChatMistralAI
                return ChatMistralAI(
                    model=default_mistral_model,
                    mistral_api_key=mistral_key,
                    temperature=temperature,
                    streaming=streaming,
                    timeout=30
                )
            raise ValueError(
                "GEMINI_API_KEY not found. Please configure GEMINI_API_KEY or MISTRAL_API_KEY in your server environment variables."
            )

        from langchain_google_genai import ChatGoogleGenerativeAI
        selected_model = model_name or default_gemini_model
        gemini_chat = ChatGoogleGenerativeAI(
            model=selected_model,
            google_api_key=gemini_key,
            temperature=temperature,
            streaming=streaming
        )

        if mistral_key:
            from langchain_mistralai import ChatMistralAI
            fallback_chat = ChatMistralAI(
                model=default_mistral_model,
                mistral_api_key=mistral_key,
                temperature=temperature,
                streaming=streaming,
                timeout=20,
                max_retries=1
            )
            return gemini_chat.with_fallbacks([fallback_chat])
        return gemini_chat

    # Initialize Mistral (Primary Provider)
    elif provider.lower() == "mistral":
        if not mistral_key:
            if gemini_key:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model=default_gemini_model,
                    google_api_key=gemini_key,
                    temperature=temperature,
                    streaming=streaming
                )
            raise ValueError(
                "MISTRAL_API_KEY not found. Please configure MISTRAL_API_KEY or GEMINI_API_KEY in your server environment variables."
            )

        from langchain_mistralai import ChatMistralAI
        selected_model = model_name or default_mistral_model
        mistral_chat = ChatMistralAI(
            model=selected_model,
            mistral_api_key=mistral_key,
            temperature=temperature,
            streaming=streaming,
            timeout=20,
            max_retries=1
        )

        if gemini_key:
            from langchain_google_genai import ChatGoogleGenerativeAI
            fallback_chat = ChatGoogleGenerativeAI(
                model=default_gemini_model,
                google_api_key=gemini_key,
                temperature=temperature,
                streaming=streaming
            )
            return mistral_chat.with_fallbacks([fallback_chat])
        return mistral_chat

    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
