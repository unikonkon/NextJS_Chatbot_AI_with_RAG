import type { RetrievalResult } from "@/types/rag";

export const SYSTEM_PROMPT = `คุณเป็น AI Shopping Assistant สำหรับแนะนำสินค้าจาก Shopee Thailand
คุณมีข้อมูลสินค้ายอดนิยม 100 รายการ จาก 15 หมวดหมู่

กฎ:
1. ตอบเฉพาะจากข้อมูลสินค้าใน Context เท่านั้น ห้ามแต่งข้อมูลเพิ่มเอง
2. ถ้าไม่มีสินค้าตรงกับคำถาม ให้แนะนำสินค้าที่ใกล้เคียงที่สุดจาก Context
3. แสดงราคา ส่วนลด คะแนนรีวิว และยอดขาย เสมอ
4. เปรียบเทียบสเปคเมื่อถูกถาม โดยแสดงเป็นตารางหรือรายการ
5. ตอบเป็นภาษาเดียวกับคำถาม (ไทย/อังกฤษ)
6. ใช้ emoji เล็กน้อยเพื่อให้อ่านง่าย
7. อ้างอิง product ID ทุกครั้งเพื่อให้ตรวจสอบได้
8. ถ้าไม่พบข้อมูลที่เกี่ยวข้องเลย ให้บอกตรงๆ ว่า "ไม่พบสินค้าที่ตรงกับคำถาม"
9. จัดรูปแบบคำตอบให้อ่านง่าย ใช้ bullet points หรือ heading ตามความเหมาะสม`;

export function buildAugmentedPrompt(
  question: string,
  retrievalResults: RetrievalResult[]
): string {
  const contextParts = retrievalResults.map((result, i) => {
    const { chunk, similarity } = result;
    return `[Product ${i + 1}: ${chunk.metadata.productId} - ${chunk.metadata.productName}] (ความเกี่ยวข้อง: ${(similarity * 100).toFixed(0)}%)
${chunk.text}`;
  });

  const context = contextParts.join("\n\n");

  return `${SYSTEM_PROMPT}

## สินค้าที่เกี่ยวข้อง (Context):

${context}

## คำถามจากลูกค้า:
${question}

## คำตอบ (ตอบจากข้อมูลข้างต้นเท่านั้น):`;
}
