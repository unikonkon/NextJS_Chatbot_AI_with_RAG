import { NextRequest } from "next/server";
import { runRAGPipeline, runRAGPipelineStream } from "@/lib/rag/pipeline";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import { GeminiError } from "@/lib/rag/generator";

function geminiErrorToStatus(code: string): number {
  switch (code) {
    case "RATE_LIMIT":
      return 429;
    case "SERVICE_UNAVAILABLE":
      return 503;
    case "AUTH_ERROR":
      return 401;
    case "MODEL_NOT_FOUND":
      return 404;
    case "PAYLOAD_TOO_LARGE":
      return 413;
    case "CONFIG_ERROR":
      return 500;
    default:
      return 502; // Bad Gateway - upstream (Gemini) failed
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, queryVector, options, stream } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Message is required and must be a string", code: "INVALID_MESSAGE" },
        { status: 400 }
      );
    }

    if (!queryVector || !Array.isArray(queryVector)) {
      return Response.json(
        { error: "queryVector is required (embed the message client-side first)", code: "MISSING_VECTOR" },
        { status: 400 }
      );
    }

    const store = getKnowledgeStore();
    if (!store.hasEmbeddings()) {
      return Response.json(
        { error: "Knowledge base not initialized. Please initialize first.", code: "KB_NOT_READY" },
        { status: 503 }
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
            const errCode =
              error instanceof GeminiError ? error.code : "STREAM_ERROR";
            const data = `data: ${JSON.stringify({ type: "error", data: errMsg, code: errCode })}\n\n`;
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

    if (error instanceof GeminiError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: geminiErrorToStatus(error.code) }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
