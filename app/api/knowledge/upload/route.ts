import { NextRequest } from "next/server";
import { parseKnowledgeBaseJSON } from "@/lib/knowledge/json-loader";
import { loadKnowledgeBaseFromFile } from "@/lib/knowledge/json-loader";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import { productsToChunks } from "@/lib/rag/chunker";
import { embedBatch } from "@/lib/rag/embedding-service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { error: "No file uploaded. Please upload a JSON file." },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".json")) {
      return Response.json(
        { error: "Only JSON files are supported." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const kb = parseKnowledgeBaseJSON(text);

    // Re-initialize store with base KB + pre-computed embeddings
    const store = getKnowledgeStore();
    const baseKb = await loadKnowledgeBaseFromFile();
    await store.initializeFromPrecomputed(baseKb.products);

    // Embed and append the uploaded products server-side
    const chunks = productsToChunks(kb.products);
    const chunkTexts = chunks.map((c) => c.text);
    const vectors = await embedBatch(chunkTexts);

    const result = await store.appendProducts(kb.products, vectors);
    const status = store.getStatus();

    return Response.json({
      success: true,
      documentsCount: kb.products.length,
      embeddingsCount: status.embeddingsCount,
      added: result.added,
      skipped: result.skipped,
      total: status.productsCount,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
