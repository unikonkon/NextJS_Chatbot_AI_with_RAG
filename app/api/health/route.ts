import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import { loadKnowledgeBaseFromFile } from "@/lib/knowledge/json-loader";
import { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, GEMINI_MODEL } from "@/lib/utils/constants";

export async function GET() {
  try {
    // Auto-init if needed
    const store = getKnowledgeStore();
    if (!store.hasEmbeddings()) {
      try {
        const kb = await loadKnowledgeBaseFromFile();
        await store.initializeFromPrecomputed(kb.products);
      } catch {
        // If embeddings.json doesn't exist yet, report not ready
      }
    }

    const status = store.getStatus();

    return Response.json({
      status: "ok",
      embeddingMode: "server-side (pre-computed)",
      embeddingModel: EMBEDDING_MODEL,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      geminiModel: GEMINI_MODEL,
      knowledgeBaseSize: status.productsCount,
      embeddingsCount: status.embeddingsCount,
      isReady: status.embeddingsCount > 0,
      baseProductsCount: status.baseProductsCount,
      customProductsCount: status.customProductsCount,
      maxProducts: status.maxProducts,
    });
  } catch (error) {
    console.error("Health API error:", error);
    return Response.json(
      { status: "error", message: "Health check failed" },
      { status: 500 }
    );
  }
}
