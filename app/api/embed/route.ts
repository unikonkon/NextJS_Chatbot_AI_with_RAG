import { NextRequest } from "next/server";
import { embedText, embedTexts } from "@/lib/rag/embedding";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts } = body;

    if (texts && Array.isArray(texts)) {
      const vectors = await embedTexts(texts);
      return Response.json({ vectors });
    }

    if (text && typeof text === "string") {
      const vector = await embedText(text);
      return Response.json({ vector });
    }

    return Response.json(
      { error: "Either 'text' (string) or 'texts' (string[]) is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Embed API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
