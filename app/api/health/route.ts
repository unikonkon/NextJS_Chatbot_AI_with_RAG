import { isModelLoaded } from "@/lib/rag/embedding";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import { EMBEDDING_MODEL, GEMINI_MODEL } from "@/lib/utils/constants";

export async function GET() {
  try {
    const store = getKnowledgeStore();
    const status = store.getStatus();

    return Response.json({
      status: "ok",
      embeddingModelLoaded: isModelLoaded(),
      embeddingModel: EMBEDDING_MODEL,
      geminiModel: GEMINI_MODEL,
      knowledgeBaseSize: status.productsCount,
      embeddingsCount: status.embeddingsCount,
      isReady: isModelLoaded() && status.embeddingsCount > 0,
    });
  } catch (error) {
    console.error("Health API error:", error);
    return Response.json(
      { status: "error", message: "Health check failed" },
      { status: 500 }
    );
  }
}
