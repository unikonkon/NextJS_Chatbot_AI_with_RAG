import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load env from .env.local
import { config } from "dotenv";
config({ path: join(process.cwd(), ".env.local") });

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GOOGLE_API_KEY (or GOOGLE_GEMINI_API_KEY) is not set in .env.local");
  process.exit(1);
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: string | null;
  soldCount: number;
  rating: number;
  shopName: string;
  shopLocation: string;
  isMall: boolean;
  isPreferred: boolean;
  freeShipping: boolean;
  category: string;
  brand: string;
  tags: string[];
  specs: Record<string, string | number | boolean>;
  warranty: string;
  returnPolicy: string;
}

interface EmbeddedProduct {
  text: string;
  metadata: {
    productId: string;
    productName: string;
    category: string;
    brand: string;
    price: number;
  };
  vector: number[];
}

function productToChunkText(product: Product): string {
  const specsText = Object.entries(product.specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  const tagsText = product.tags.join(", ");

  return `[${product.name}] ${product.description}
หมวดหมู่: ${product.category} | แบรนด์: ${product.brand}
ราคา: ฿${product.price.toLocaleString()} ${product.discount ? `(ลด ${product.discount})` : ""} | ราคาเดิม: ฿${product.originalPrice.toLocaleString()} | ขายแล้ว: ${product.soldCount.toLocaleString()} ชิ้น | ⭐ ${product.rating}
ร้าน: ${product.shopName} (${product.shopLocation})${product.isMall ? " [Shopee Mall]" : ""}${product.freeShipping ? " [ส่งฟรี]" : ""}
สเปค: ${specsText}
แท็ก: ${tagsText}
รับประกัน: ${product.warranty} | คืนสินค้า: ${product.returnPolicy}`;
}

async function embedBatch(
  genAI: GoogleGenerativeAI,
  texts: string[],
  batchSize: number = 10
): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const allVectors: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    // Retry with backoff on rate limit
    let retries = 0;
    while (true) {
      try {
        const result = await model.batchEmbedContents({
          requests: batch.map((text) => ({
            content: { parts: [{ text }], role: "user" },
          })),
        });

        for (const embedding of result.embeddings) {
          allVectors.push(embedding.values);
        }
        break;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("429") && retries < 3) {
          retries++;
          const waitSec = 60 * retries;
          console.log(`  Rate limited — waiting ${waitSec}s (retry ${retries}/3)...`);
          await new Promise((r) => setTimeout(r, waitSec * 1000));
        } else {
          throw error;
        }
      }
    }

    const done = Math.min(i + batchSize, texts.length);
    console.log(`  Embedded ${done}/${texts.length} chunks`);

    // Delay between batches to stay under free-tier quota (100 req/min)
    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 7000));
    }
  }

  return allVectors;
}

async function main() {
  console.log("=== Pre-compute Embeddings ===");
  console.log(`Model: ${EMBEDDING_MODEL}`);

  // 1. Read KB
  const kbPath = join(process.cwd(), "public", "data", "shopee-products-knowledge-base.json");
  console.log(`\nReading knowledge base: ${kbPath}`);

  const raw = await readFile(kbPath, "utf-8");
  const kb = JSON.parse(raw);
  const products: Product[] = kb.products;
  console.log(`Found ${products.length} products`);

  // 2. Convert to chunks
  console.log("\nConverting products to text chunks...");
  const chunkTexts = products.map(productToChunkText);

  // 3. Embed all chunks
  console.log(`\nEmbedding ${chunkTexts.length} chunks with ${EMBEDDING_MODEL}...`);
  const genAI = new GoogleGenerativeAI(API_KEY!);
  const vectors = await embedBatch(genAI, chunkTexts);

  console.log(`\nGenerated ${vectors.length} vectors (${vectors[0].length} dimensions each)`);

  // 4. Build output
  const embeddedProducts: EmbeddedProduct[] = products.map((product, i) => ({
    text: chunkTexts[i],
    metadata: {
      productId: product.id,
      productName: product.name,
      category: product.category,
      brand: product.brand,
      price: product.price,
    },
    vector: vectors[i],
  }));

  // 5. Write embeddings.json
  const outPath = join(process.cwd(), "public", "data", "embeddings.json");
  const json = JSON.stringify(embeddedProducts);
  await writeFile(outPath, json, "utf-8");

  const sizeKB = Math.round(Buffer.byteLength(json) / 1024);
  console.log(`\nWrote ${outPath}`);
  console.log(`Size: ${sizeKB} KB (${embeddedProducts.length} products x ${vectors[0].length} dimensions)`);
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Pre-embed failed:", err);
  process.exit(1);
});
