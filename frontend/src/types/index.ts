export interface VideoMetadata {
  title: string;
  channel: string;
  duration: number;
  thumbnail: string | null;
  video_id?: string;
  view_count?: number;
  upload_date?: string;
  description?: string;
}

export interface SummaryRecord {
  id: string;
  title: string;
  sourceType: "video" | "document" | "web" | "text";
  sourceUrl?: string;
  filename?: string;
  charCount: number;
  provider: string;
  model: string;
  englishSummary: string;
  hindiSummary: string;
  actionItems?: string;
  keyDecisions?: string;
  questions?: string;
  transcript?: string;
  metadata?: any;
  createdAt: string;
}

export interface SourceChunk {
  chunk_index: number;
  content: string;
  metadata?: Record<string, any>;
}

export interface RAGQueryResult {
  answer: string;
  sources: SourceChunk[];
  retrieved_count: number;
  active_document?: string;
}

export interface RAGStatus {
  active_document: string | null;
  char_count: number;
  total_chunks: number;
  suggested_questions: string[];
  chroma_dir_exists: boolean;
}

export interface AppSettings {
  provider: "mistral" | "gemini";
  mistralModel: string;
  geminiModel: string;
  ragTopK: number;
  summaryLength: "short" | "medium" | "detailed";
  targetLanguage: "english" | "hindi" | "both";
  theme: "dark" | "system";
}

export interface SystemHealth {
  nodeBackend: string;
  aiService: {
    status: string;
    service: string;
    mistral_available: boolean;
    gemini_available: boolean;
    ffmpeg_available: boolean;
    default_mistral_model: string;
    chroma_dir_exists: boolean;
    active_document: string | null;
  };
  currentSettings: AppSettings;
}
