import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL } from "@/lib/utils/constants";

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiError(
        "GOOGLE_GEMINI_API_KEY is not set in environment variables",
        "CONFIG_ERROR"
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Custom error class สำหรับแยกประเภท error จาก Gemini
export class GeminiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
  }
}

function handleGeminiError(error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  const msgLower = msg.toLowerCase();

  // Rate limit / quota exceeded (429)
  if (msgLower.includes("429") || msgLower.includes("rate limit") || msgLower.includes("quota")) {
    throw new GeminiError(
      "Gemini API ถูกจำกัดการใช้งาน (Rate Limit) กรุณารอสักครู่แล้วลองใหม่",
      "RATE_LIMIT"
    );
  }

  // Service unavailable (503)
  if (msgLower.includes("503") || msgLower.includes("overloaded") || msgLower.includes("unavailable")) {
    throw new GeminiError(
      "Gemini API ไม่พร้อมให้บริการชั่วคราว (503) กรุณารอสักครู่แล้วลองใหม่",
      "SERVICE_UNAVAILABLE"
    );
  }

  // Authentication / invalid API key (401, 403)
  if (msgLower.includes("401") || msgLower.includes("403") || msgLower.includes("api key") || msgLower.includes("permission")) {
    throw new GeminiError(
      "API Key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน กรุณาตรวจสอบ GOOGLE_GEMINI_API_KEY",
      "AUTH_ERROR"
    );
  }

  // Not found (404) - wrong model name
  if (msgLower.includes("404") || msgLower.includes("not found")) {
    throw new GeminiError(
      `ไม่พบโมเดล ${GEMINI_MODEL} กรุณาตรวจสอบชื่อโมเดลในการตั้งค่า`,
      "MODEL_NOT_FOUND"
    );
  }

  // Request too large (400 with content length)
  if (msgLower.includes("too large") || msgLower.includes("content length") || msgLower.includes("token limit")) {
    throw new GeminiError(
      "ข้อมูลมีขนาดใหญ่เกินไปสำหรับ Gemini API กรุณาลดจำนวน context",
      "PAYLOAD_TOO_LARGE"
    );
  }

  // Generic / unknown error
  throw new GeminiError(
    `Gemini API error: ${msg}`,
    "UNKNOWN"
  );
}

export async function generateResponse(
  prompt: string,
  temperature: number = 0.7
): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
      topP: 0.95,
      topK: 40,
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    handleGeminiError(error);
  }
}

export async function* generateResponseStream(
  prompt: string,
  temperature: number = 0.7
): AsyncGenerator<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
      topP: 0.95,
      topK: 40,
    },
  });

  try {
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    handleGeminiError(error);
  }
}
