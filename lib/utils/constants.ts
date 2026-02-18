export const DEFAULT_TOP_K = 5;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.3;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_CONTEXT_LENGTH = 4000;

export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export const SUGGESTED_QUESTIONS = [
  "มีหูฟังบลูทูธตัดเสียงรบกวนรุ่นไหนดี?",
  "iPhone 16 Pro Max กับ Samsung S25 Ultra ต่างกันยังไง?",
  "แนะนำโน้ตบุ๊คเกมมิ่งงบ 30,000",
  "สินค้าอะไรลดราคามากที่สุด?",
  "สินค้าอะไรขายดีที่สุด?",
  "แนะนำสินค้า beauty ราคาไม่เกิน 1000 บาท",
];
