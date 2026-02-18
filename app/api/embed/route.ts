import { NextRequest } from "next/server";

// Server-side embedding is no longer supported.
// Use @huggingface/transformers client-side via lib/rag/embeddings-client.ts
export async function POST(request: NextRequest) {
  return Response.json(
    {
      error:
        "Server-side embedding is not available. Use client-side embedding with @huggingface/transformers instead.",
    },
    { status: 410 }
  );
}
