export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  sources?: SourceReference[];
  isStreaming?: boolean;
}

export interface SourceReference {
  productId: string;
  productName: string;
  similarity: number;
  category: string;
  price: number;
  // Match explanation
  rank: number;
  matchedChunkText: string;
  embeddingModel: string;
  similarityThreshold: number;
  totalCandidates: number;
  dimensions: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatRequest {
  message: string;
  chatHistory?: Message[];
  options?: {
    topK?: number;
    temperature?: number;
  };
}

export interface ChatResponse {
  answer: string;
  sources: SourceReference[];
  confidence: number;
}
