import { NextRequest } from "next/server";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import { loadKnowledgeBaseFromFile } from "@/lib/knowledge/json-loader";

export async function GET() {
  try {
    const store = getKnowledgeStore();
    const status = store.getStatus();

    return Response.json({
      ...status,
      products: store.getProducts(),
    });
  } catch (error) {
    console.error("Knowledge API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: { action?: string } = {};
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body. Send { action: 'load' | 'embed' | 'initialize' }" },
        { status: 400 }
      );
    }
    const { action } = body;

    const store = getKnowledgeStore();

    if (action === "load") {
      const kb = await loadKnowledgeBaseFromFile();
      await store.loadFromKnowledgeBase(kb);
      return Response.json({
        success: true,
        message: "Knowledge base loaded",
        productsCount: kb.products.length,
      });
    }

    if (action === "embed") {
      if (!store.getStatus().isInitialized) {
        return Response.json(
          { error: "Knowledge base not loaded. Call with action='load' first." },
          { status: 400 }
        );
      }
      await store.embedAllChunks();
      return Response.json({
        success: true,
        message: "Embeddings created",
        embeddingsCount: store.getEmbeddedChunks().length,
      });
    }

    if (action === "initialize") {
      const kb = await loadKnowledgeBaseFromFile();
      await store.loadFromKnowledgeBase(kb);
      await store.embedAllChunks();
      return Response.json({
        success: true,
        message: "Knowledge base loaded and embedded",
        productsCount: kb.products.length,
        embeddingsCount: store.getEmbeddedChunks().length,
      });
    }

    return Response.json(
      { error: "Invalid action. Use 'load', 'embed', or 'initialize'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Knowledge API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
