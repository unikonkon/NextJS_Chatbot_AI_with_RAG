import type { Product, Chunk, ChunkMetadata } from "@/types/knowledge";

export function productToChunk(product: Product): Chunk {
  const specsText = Object.entries(product.specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  const tagsText = product.tags.join(", ");

  const text = `[${product.name}] ${product.description}
หมวดหมู่: ${product.category} | แบรนด์: ${product.brand}
ราคา: ฿${product.price.toLocaleString()} ${product.discount ? `(ลด ${product.discount})` : ""} | ราคาเดิม: ฿${product.originalPrice.toLocaleString()} | ขายแล้ว: ${product.soldCount.toLocaleString()} ชิ้น | ⭐ ${product.rating}
ร้าน: ${product.shopName} (${product.shopLocation})${product.isMall ? " [Shopee Mall]" : ""}${product.freeShipping ? " [ส่งฟรี]" : ""}
สเปค: ${specsText}
แท็ก: ${tagsText}
รับประกัน: ${product.warranty} | คืนสินค้า: ${product.returnPolicy}`;

  const metadata: ChunkMetadata = {
    productId: product.id,
    productName: product.name,
    category: product.category,
    brand: product.brand,
    price: product.price,
    originalPrice: product.originalPrice,
    discount: product.discount,
    rating: product.rating,
    soldCount: product.soldCount,
    isMall: product.isMall,
    freeShipping: product.freeShipping,
  };

  return {
    id: `chunk-${product.id}`,
    productId: product.id,
    text,
    metadata,
  };
}

export function productsToChunks(products: Product[]): Chunk[] {
  return products.map(productToChunk);
}
