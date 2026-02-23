import { NextRequest } from "next/server";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import { loadKnowledgeBaseFromFile } from "@/lib/knowledge/json-loader";
import { validateProduct } from "@/lib/knowledge/schema-validator";
import { productsToChunks } from "@/lib/rag/chunker";
import { embedBatch } from "@/lib/rag/embedding-service";
import type { Product } from "@/types/knowledge";

/**
 * Auto-initialize KB + pre-computed embeddings if not already done
 */
async function ensureInitialized() {
  const store = getKnowledgeStore();
  if (!store.hasEmbeddings()) {
    const kb = await loadKnowledgeBaseFromFile();
    await store.initializeFromPrecomputed(kb.products);
  }
}

export async function GET() {
  try {
    await ensureInitialized();

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

    // Auto-init on any POST
    await ensureInitialized();
    const store = getKnowledgeStore();

    // Initialize action (kept for backward compat, now just returns status)
    if (action === "load" || action === "initialize") {
      const status = store.getStatus();
      return Response.json({
        success: true,
        message: "Knowledge base loaded with pre-computed embeddings",
        productsCount: status.productsCount,
        embeddingsCount: status.embeddingsCount,
      });
    }

    // Append custom products — server embeds them
    if (action === "append") {
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

      // Server-side embed
      const chunks = productsToChunks(validProducts);
      const chunkTexts = chunks.map((c) => c.text);
      const vectors = await embedBatch(chunkTexts);

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
      { error: "Invalid action. Use 'initialize' or 'append'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Knowledge API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
