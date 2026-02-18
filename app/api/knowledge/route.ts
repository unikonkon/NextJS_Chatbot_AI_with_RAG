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
    let body: { action?: string; products?: unknown[] } = {};
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body. Send { action: 'load' | 'embed' | 'initialize' | 'append' }" },
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
      const status = store.getStatus();
      return Response.json({
        success: true,
        message: "Knowledge base loaded and embedded",
        productsCount: status.productsCount,
        embeddingsCount: status.embeddingsCount,
        baseProductsCount: status.baseProductsCount,
        customProductsCount: status.customProductsCount,
        maxProducts: status.maxProducts,
      });
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

      const result = await store.appendProducts(validProducts);
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
      { error: "Invalid action. Use 'load', 'embed', 'initialize', or 'append'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Knowledge API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
