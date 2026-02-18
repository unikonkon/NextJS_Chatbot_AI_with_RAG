import { NextRequest } from "next/server";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import { loadKnowledgeBaseFromFile } from "@/lib/knowledge/json-loader";
import { validateProduct } from "@/lib/knowledge/schema-validator";
import type { Product } from "@/types/knowledge";

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
    let body: {
      action?: string;
      products?: unknown[];
      vectors?: number[][];
    } = {};
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }
    const { action } = body;

    const store = getKnowledgeStore();

    // Load products from file, create chunks, return chunk texts for client-side embedding
    if (action === "load" || action === "initialize") {
      const kb = await loadKnowledgeBaseFromFile();
      await store.loadFromKnowledgeBase(kb);
      const chunkTexts = store.getChunkTexts();

      return Response.json({
        success: true,
        message: "Knowledge base loaded (awaiting embeddings from client)",
        productsCount: kb.products.length,
        chunksCount: chunkTexts.length,
        chunkTexts,
      });
    }

    // Store pre-computed vectors from client
    if (action === "store-vectors") {
      if (!store.getStatus().isInitialized) {
        return Response.json(
          { error: "Knowledge base not loaded. Call with action='load' first." },
          { status: 400 }
        );
      }

      if (!body.vectors || !Array.isArray(body.vectors)) {
        return Response.json(
          { error: "vectors array is required" },
          { status: 400 }
        );
      }

      store.storeVectors(body.vectors);

      return Response.json({
        success: true,
        message: "Embeddings stored",
        embeddingsCount: store.getEmbeddedChunks().length,
        productsCount: store.getStatus().productsCount,
        baseProductsCount: store.getStatus().baseProductsCount,
        customProductsCount: store.getStatus().customProductsCount,
        maxProducts: store.getStatus().maxProducts,
      });
    }

    if (action === "embed") {
      return Response.json(
        { error: "Server-side embedding is not supported. Embed client-side and use 'store-vectors'." },
        { status: 400 }
      );
    }

    if (action === "append") {
      if (!store.getStatus().isInitialized) {
        return Response.json(
          { error: "Knowledge base not initialized. Initialize first." },
          { status: 400 }
        );
      }

      if (!Array.isArray(body.products) || body.products.length === 0) {
        return Response.json(
          { error: "products array is required for append action." },
          { status: 400 }
        );
      }

      const validProducts: Product[] = [];
      const errors: string[] = [];
      for (let i = 0; i < body.products.length; i++) {
        const result = validateProduct(body.products[i]);
        if (result.success) {
          validProducts.push(result.data as Product);
        } else {
          errors.push(`Product[${i}]: ${result.error.issues.map((e) => e.message).join(", ")}`);
        }
      }

      if (validProducts.length === 0) {
        return Response.json(
          { error: `No valid products found. Errors: ${errors.join("; ")}` },
          { status: 400 }
        );
      }

      const vectors = body.vectors && Array.isArray(body.vectors) ? body.vectors : undefined;

      if (!vectors) {
        // Return chunk texts so client can embed them
        const chunkTexts = store.getAppendChunkTexts(validProducts);
        return Response.json({
          success: true,
          needsEmbedding: true,
          chunkTexts,
          validProductsCount: validProducts.length,
        });
      }

      const result = await store.appendProducts(validProducts, vectors);
      const status = store.getStatus();

      return Response.json({
        success: true,
        added: result.added,
        skipped: result.skipped,
        invalidCount: errors.length,
        total: status.productsCount,
        baseProductsCount: status.baseProductsCount,
        customProductsCount: status.customProductsCount,
        maxProducts: status.maxProducts,
      });
    }

    return Response.json(
      { error: "Invalid action. Use 'load', 'initialize', 'store-vectors', or 'append'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Knowledge API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
