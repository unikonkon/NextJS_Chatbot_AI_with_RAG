import { NextRequest } from "next/server";
import { runRAGPipeline, runRAGPipelineStream } from "@/lib/rag/pipeline";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, queryVector, options, stream } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    if (!queryVector || !Array.isArray(queryVector)) {
      return Response.json(
        { error: "queryVector is required (embed the message client-side first)" },
        { status: 400 }
      );
    }

    const store = getKnowledgeStore();
    if (!store.hasEmbeddings()) {
      return Response.json(
        { error: "Knowledge base not initialized. Please initialize first." },
        { status: 400 }
      );
    }

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of runRAGPipelineStream(message, queryVector, options)) {
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
    const result = await runRAGPipeline(message, queryVector, options);

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
