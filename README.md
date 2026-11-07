# ⚡ SUMMARIZER OP — Full-Stack AI SaaS Workspace

> **Your knowledge, simplified.**  
> A full-stack, enterprise-grade AI summarization and document intelligence application built with **React**, **TypeScript**, **Node.js/Express**, **Python FastAPI**, **Mistral AI**, **LangChain (LCEL)**, and **ChromaDB**.

---

## 🏗️ System Architecture

```text
                               ┌─────────────────────────────────────────┐
                               │       React + TypeScript Frontend       │
                               │  Vite • Tailwind CSS • Framer Motion    │
                               │             (Port 3000)                 │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼ (REST / HTTP)
                               ┌─────────────────────────────────────────┐
                               │       Node.js Express API Gateway       │
                               │     TypeScript • Multer File Upload     │
                               │        Persistent History Store         │
                               │             (Port 5000)                 │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼ (Internal HTTP)
                               ┌─────────────────────────────────────────┐
                               │       Python FastAPI Microservice       │
                               │              (Port 8000)                │
                               └──────┬─────────────┬─────────────┬──────┘
                                      │             │             │
                    ┌─────────────────▼──┐   ┌──────▼──────┐   ┌──▼──────────────────┐
                    │  Mistral / Gemini  │   │  ChromaDB   │   │ Whisper / FFmpeg /  │
                    │  LangChain LCEL    │   │ HuggingFace │   │       yt-dlp        │
                    └────────────────────┘   └─────────────┘   └─────────────────────┘
```

---

## 🌟 Application Modules & Pages

### 1. 🏠 Dashboard (`/`)
- Welcome Hero: *"Your knowledge, simplified."*
- Real-time application metrics (Total Summaries, Active LLM, Indexed Chunks, Target Document).
- Three interactive feature cards for direct routing to Video, Document, and RAG chat.
- Live recent summaries feed with 1-click detail review.

### 2. 🎬 Video Summarizer (`/video`)
- Direct YouTube URL ingestion and genuine video metadata preview (thumbnail, channel, duration).
- Multi-stage pipeline: Fast captions or Whisper audio chunking $\rightarrow$ Executive summary $\rightarrow$ Hindi translation $\rightarrow$ Action items.
- Dual-tab bilingual display with Markdown copy and file export.
- 1-click **"Chat with this in RAG"** bridge.

### 3. 📄 Document Summarizer (`/document`)
- Drag-and-drop file upload supporting **PDF, DOCX, TXT, MD, CSV, JSON, and media files**.
- Extracts structured action items, major decisions, and questions.
- Generates natural English summaries and fluent Hindi translations.

### 4. 💬 Ask Your Documents — Conversational RAG (`/rag`)
- Conversational interface grounded strictly in document contents using **ChromaDB** and **HuggingFace `all-MiniLM-L6-v2`** embeddings.
- Inspect exact retrieved chunk segments with chunk indices for zero hallucination.
- Dynamic clickable suggested follow-up questions.
- Session conversation memory and clear-chat control.

### 5. 🕒 Summary History (`/history`)
- File-persisted archive (`backend/data/history.json`) across application restarts.
- Search by keyword or filter by source type (`video` / `document`).
- Full modal preview, copy, deletion, and bulk JSON export.

### 6. ⚙️ Settings (`/settings`)
- Toggle primary AI provider between **Mistral AI** (`ministral-8b-latest`, `codestral-latest`) and **Google Gemini** fallback.
- Configure RAG top-K retrieved chunk thresholds (1 to 8).
- Real-time credentials and system health status.

---

## 🎨 Brand Design System

| Element | Specification |
|:---|:---|
| **Background** | `#09090F` |
| **Surface / Card** | `#11111B` / `#161626` |
| **Sidebar** | `#0D0D16` |
| **Primary Accent** | Purple (`#8B5CF6`) |
| **Secondary Accent** | Indigo (`#6366F1`) |
| **Success / Error** | Emerald (`#10B981`) / Rose (`#EF4444`) |
| **Typography** | Plus Jakarta Sans, JetBrains Mono |

---

## 📁 Project Directory Structure

```text
D:\AI_Agent\
├── frontend/                   # React + TypeScript + Vite + Tailwind SPA
│   ├── src/
│   │   ├── components/         # Reusable UI (Sidebar, Navbar, SummaryViewer, SourceCards, Toast)
│   │   ├── context/            # AppContext (global state, settings, health, toasts)
│   │   ├── layouts/            # MainLayout
│   │   ├── pages/              # Dashboard, Video, Document, RAG, History, Settings
│   │   ├── services/           # Axios API services
│   │   ├── types/              # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                    # Node.js + Express + TypeScript API Gateway
│   ├── src/
│   │   ├── controllers/        # video, document, rag, history, settings
│   │   ├── services/           # aiService (calls FastAPI), historyService, settingsService
│   │   ├── routes/             # REST route definitions
│   │   ├── middleware/         # Multer file upload & error handling
│   │   └── server.ts           # Express server entry point (Port 5000)
│   ├── data/                   # Persistent history.json & settings.json
│   └── package.json
│
├── ai_service/                 # Python FastAPI AI Microservice (Port 8000)
│   └── main.py                 # REST endpoints wrapping core/ and utils/
│
├── core/                       # Preserved Python AI Backend
│   ├── llm_factory.py          # Unified LLM provider with failover
│   ├── summarise.py            # Single-pass & Map-Reduce LCEL summarization
│   ├── extractor.py            # Structured intelligence extraction
│   ├── translator.py           # Bilingual English-to-Hindi LCEL translation
│   ├── vector_store.py         # ChromaDB initialization & embedding caching
│   ├── rag_engine.py           # Grounded RAG retrieval & suggested questions
│   └── transcriber.py          # OpenAI Whisper speech-to-text
│
├── utils/                      # Preserved Python Utilities
│   └── audio_processor.py      # YouTube metadata, ffmpeg audio converter, doc extractors
│
├── legacy_streamlit/           # Preserved Streamlit frontend (for reference)
├── package.json                # Root concurrent scripts
├── run_app.py                  # Python unified multi-process launcher
└── .env                        # Environment secrets (MISTRAL_API_KEY, GEMINI_API_KEY)
```

---

## 🚀 How to Run the Application

### Option A: Unified One-Command Runner (Recommended)

From the project root:

```bash
npm run dev
```

*Or alternatively using the Python runner:*

```bash
python run_app.py
```

This concurrently launches all three services:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Node.js API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Python AI Service**: [http://localhost:8000](http://localhost:8000)

---

### Option B: Running Services Individually

1. **Python AI Microservice**:
   ```bash
   python -m uvicorn ai_service.main:app --host 127.0.0.1 --port 8000
   ```

2. **Node.js Backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **React Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🔒 Security & Best Practices

- **Zero API Key Leakage**: API keys (`MISTRAL_API_KEY`, `GEMINI_API_KEY`) reside exclusively in the server environment and are never returned to the frontend.
- **Failover & Resilience**: LangChain `.with_fallbacks()` ensures that transient network issues automatically fall back between providers.
- **Persistent Storage**: Summaries and user configurations are persisted to disk in `backend/data/` without requiring heavy external database servers.
- **Clean File Lifecycle**: Uploaded documents are automatically cleaned from disk after indexing or summarization.
