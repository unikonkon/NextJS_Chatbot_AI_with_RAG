import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  originalPrice: z.number().positive(),
  discount: z.string().nullable(),
  soldCount: z.number().min(0),
  rating: z.number().min(0).max(5),
  shopName: z.string(),
  shopLocation: z.string(),
  isMall: z.boolean(),
  isPreferred: z.boolean(),
  freeShipping: z.boolean(),
  category: z.string(),
  brand: z.string(),
  tags: z.array(z.string()),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  warranty: z.string(),
  returnPolicy: z.string(),
});

export const KnowledgeBaseSchema = z.object({
  version: z.string(),
  name: z.string(),
  description: z.string(),
  source: z.string(),
  scrapedAt: z.string(),
  totalProducts: z.number(),
  categories: z.array(z.string()),
  products: z.array(ProductSchema),
});

export function validateKnowledgeBase(data: unknown) {
  return KnowledgeBaseSchema.safeParse(data);
}

export function validateProduct(data: unknown) {
  return ProductSchema.safeParse(data);
}
