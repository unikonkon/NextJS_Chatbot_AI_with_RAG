import { readFile } from "fs/promises";
import { join } from "path";
import { validateKnowledgeBase } from "./schema-validator";
import type { KnowledgeBase } from "@/types/knowledge";

export async function loadKnowledgeBaseFromFile(
  filePath?: string
): Promise<KnowledgeBase> {
  const path =
    filePath ||
    join(process.cwd(), "public", "data", "shopee-products-knowledge-base.json");

  const raw = await readFile(path, "utf-8");
  const data = JSON.parse(raw);

  const result = validateKnowledgeBase(data);
  if (!result.success) {
    throw new Error(
      `Invalid knowledge base format: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ")}`
    );
  }

  return result.data as KnowledgeBase;
}

export function parseKnowledgeBaseJSON(jsonString: string): KnowledgeBase {
  const data = JSON.parse(jsonString);
  const result = validateKnowledgeBase(data);
  if (!result.success) {
    throw new Error(
      `Invalid knowledge base format: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ")}`
    );
  }
  return result.data as KnowledgeBase;
}
