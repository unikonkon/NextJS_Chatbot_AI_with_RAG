import { NextRequest } from "next/server";
import { parseKnowledgeBaseJSON } from "@/lib/knowledge/json-loader";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";

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

    const store = getKnowledgeStore();
    await store.loadFromKnowledgeBase(kb);

    // Return chunk texts for client-side embedding
    const chunkTexts = store.getChunkTexts();

    return Response.json({
      success: true,
      needsEmbedding: true,
      documentsCount: kb.products.length,
      chunksCount: chunkTexts.length,
      chunkTexts,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
