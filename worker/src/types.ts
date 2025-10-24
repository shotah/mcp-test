export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
  ALLOWED_ORIGINS?: string;
  OPENAI_EMBEDDING_MODEL?: string;
  OPENAI_CHAT_MODEL?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface EmbedRequest {
  text: string;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
}

export interface SearchResponse {
  results: any[];
}

export interface EmbedResponse {
  embedding: number[];
}

export interface HealthResponse {
  status: string;
}

export interface DebugResponse {
  status: string;
  timestamp: string;
  origin: string;
  method: string;
  pathname: string;
  corsHeaders: Record<string, string>;
}

export interface ApiResponse {
  message: string;
  version: string;
  endpoints: Record<string, string>;
}
