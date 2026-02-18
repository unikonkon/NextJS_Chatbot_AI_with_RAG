import { NextRequest } from "next/server";
import { runRAGPipeline, runRAGPipelineStream } from "@/lib/rag/pipeline";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import { loadKnowledgeBaseFromFile } from "@/lib/knowledge/json-loader";

async function ensureKnowledgeBase() {
  const store = getKnowledgeStore();
  if (!store.hasEmbeddings()) {
    const status = store.getStatus();
    if (!status.isInitialized) {
      const kb = await loadKnowledgeBaseFromFile();
      await store.loadFromKnowledgeBase(kb);
    }
    if (!status.isEmbedding && status.embeddingsCount === 0) {
      await store.embedAllChunks();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, options, stream } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    await ensureKnowledgeBase();

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of runRAGPipelineStream(message, options)) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.close();
          } catch (error) {
            const errMsg =
              error instanceof Error ? error.message : "Unknown error";
            const data = `data: ${JSON.stringify({ type: "error", data: errMsg })}\n\n`;
            controller.enqueue(encoder.encode(data));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const result = await runRAGPipeline(message, options);

    return Response.json({
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
