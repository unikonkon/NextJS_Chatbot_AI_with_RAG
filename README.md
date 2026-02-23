# Shopee AI Shopping Assistant — RAG Chatbot

AI Chatbot สำหรับค้นหา เปรียบเทียบ และแนะนำสินค้ายอดนิยมจาก Shopee Thailand
สร้างด้วย **Next.js 16** + **RAG (Retrieval-Augmented Generation)** Pipeline
Embedding ใช้ **Google `gemini-embedding-001`** Pre-compute ตอน Build Time — Deploy ได้บน **Vercel** ทุก Plan (รวม Hobby ฟรี)

---

## สารบัญ

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [RAG Pipeline](#rag-pipeline)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [API Routes](#api-routes)
- [UI Components](#ui-components)
- [Data Flow](#data-flow)
- [Knowledge Base](#knowledge-base)
- [Data Persistence](#data-persistence)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Features

| ความสามารถ | รายละเอียด |
|-----------|-----------|
| ค้นหาสินค้า | "มีหูฟังบลูทูธตัดเสียงรบกวนรุ่นไหนดี?" |
| เปรียบเทียบ | "iPhone 16 Pro Max กับ Samsung S25 Ultra ต่างกันยังไง?" |
| แนะนำตามงบ | "มีโน้ตบุ๊คเกมมิ่งงบ 30,000 ไหม?" |
| ถามสเปค | "MacBook Air M4 RAM เท่าไร แบตอยู่กี่ชม.?" |
| ถามโปรโมชัน | "สินค้าอะไรลดราคาเกิน 30%?" |
| ถามยอดขาย | "สินค้าอะไรขายดีที่สุด?" |
| ถามรับประกัน | "แอร์ Daikin รับประกันกี่ปี?" |
| กรองหมวดหมู่ | "แนะนำสินค้า beauty ราคาไม่เกิน 1000 บาท" |

- Streaming Response แบบ Real-time (SSE)
- Source Attribution แสดง similarity score + Match Analysis
- Product Detail Modal แสดงข้อมูลสินค้าครบถ้วน
- Upload JSON Knowledge Base ผ่าน Drag & Drop (สูงสุด 500 สินค้า)
- Chat History — เก็บประวัติสนทนาใน IndexedDB, สลับบทสนทนาได้
- Animated Background (Canvas 2D particle effect)
- รองรับภาษาไทยและอังกฤษ
- ⚡ **เปิดเว็บพร้อมใช้ทันที** — ไม่ต้องรอโหลด AI Model

---

## Tech Stack

### Frontend
| Library | เวอร์ชัน | บทบาท |
|---------|---------|-------|
| Next.js | 16.1.6 | Framework (App Router + Turbopack) |
| React | 19.2.3 | UI Library |
| TypeScript | 5 | Type Safety |
| Tailwind CSS | 4 | Styling (via `@tailwindcss/postcss`) |
| Framer Motion | 12.23.26 | Animations |
| Lucide React | 0.562.0 | Icons |
| class-variance-authority | 0.7.1 | Component Variants |
| clsx + tailwind-merge | — | Conditional ClassNames |
| react-dropzone | 15 | File Upload (Drag & Drop) |
| idb | 8 | IndexedDB Wrapper (Chat History, Custom Products) |

### Backend / AI / ML
| Library | บทบาท |
|---------|-------|
| `@google/generative-ai` | **Embedding** (`gemini-embedding-001`) + **Generation** (`gemini-2.0-flash`) — ใช้ API Key เดียว |
| `ml-distance` | Cosine Similarity สำหรับ Semantic Search (server-side) |
| `zod` (v4) | Schema Validation สำหรับ Knowledge Base |

> **หมายเหตุ**: ไม่ใช้ `@huggingface/transformers` อีกต่อไป — Embedding ทำผ่าน Google API ตอน Build Time แทนการโหลด WASM Model ใน Browser

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Pre-compute Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BUILD TIME (npm run build)                                 │
│  ─────────────────────────                                  │
│  ┌──────────────────┐    ┌────────────────────┐             │
│  │ Knowledge Base    │───→│ scripts/pre-embed  │             │
│  │ (100 สินค้า JSON)  │    │ gemini-embedding-001 │             │
│  └──────────────────┘    └────────┬───────────┘             │
│                                   │                         │
│                          ┌────────▼───────────┐             │
│                          │ embeddings.json     │             │
│                          │ 100 × 3072-dim       │             │
│                          │ (~4MB)            │             │
│                          └────────────────────┘             │
│                                                             │
│  RUNTIME (Vercel Serverless)                                │
│  ───────────────────────────                                │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐    │
│  │ User Query   │─→│ Embed Query│─→│ Cosine Similarity│    │
│  │              │  │ (API 1 call│  │ (in-function)    │    │
│  └──────────────┘  │  ~200ms)   │  └───────┬──────────┘    │
│                    └────────────┘          │ Top-5          │
│                                  ┌────────▼──────────┐     │
│                                  │ Gemini Generate   │     │
│                                  │ (SSE Stream)      │     │
│                                  └───────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**ข้อดีหลัก**:
- ⚡ เปิดเว็บพร้อมใช้ทันที (ไม่ต้องโหลด Model 118MB)
- 🌐 Deploy บน Vercel ได้ทุก Plan (ไม่ต้อง persistent memory)
- 🇹🇭 `gemini-embedding-001` รองรับภาษาไทยดีกว่า (3072 dimensions)
- 🔑 ใช้ Google API Key เดียวกับ Gemini

---

## RAG Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    RAG Pipeline Overview                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [User Question]                                             │
│       │                                                      │
│       ▼                                                      │
│  ┌────────────────────┐                                      │
│  │ 1. EMBED QUERY     │  Google gemini-embedding-001         │
│  │    (SERVER-SIDE)   │  API Route → Google API              │
│  │    แปลงคำถามเป็น    │  3072-dim vector                     │
│  │    3072-dim vector │  ~200ms per query                    │
│  └────────┬───────────┘                                      │
│           │ queryVector                                      │
│           ▼                                                  │
│  ┌────────────────────┐    ┌─────────────────────────┐       │
│  │ 2. RETRIEVE        │◄───│ Pre-computed Embeddings │       │
│  │    (SERVER-SIDE)   │    │ embeddings.json (static)│       │
│  │   Cosine Similarity│    │ 100 products × 3072-dim │       │
│  │   Top-K = 5        │    └─────────────────────────┘       │
│  │   Threshold ≥ 0.3  │                                      │
│  └────────┬───────────┘                                      │
│           │ top-5 relevant chunks                            │
│           ▼                                                  │
│  ┌────────────────────┐                                      │
│  │ 3. AUGMENT         │  System Prompt (Thai Shopping AI)    │
│  │    สร้าง prompt     │  + Context (5 สินค้าที่เกี่ยวข้อง)          │
│  │    รวม context     │  + User Question                     │
│  └────────┬───────────┘                                      │
│           │ augmented prompt                                 │
│           ▼                                                  │
│  ┌────────────────────┐                                      │
│  │ 4. GENERATE        │  Google Gemini API (server-side)     │
│  │    สร้างคำตอบ       │  Streaming Response (SSE)            │
│  │    + Source Refs   │  temp=0.7, maxTokens=2048            │
│  └────────┬───────────┘                                      │
│           │                                                  │
│           ▼                                                  │
│  [AI Response + Source References + Match Analysis]          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### ขั้นตอนย่อ

1. **Embed (Server)** — แปลงคำถาม user เป็น vector 3072 มิติ ด้วย Google `gemini-embedding-001` ผ่าน API Route (~200ms)
2. **Retrieve (Server)** — คำนวณ Cosine Similarity กับ pre-computed product vectors จาก `embeddings.json` → เลือก Top-5 ที่ similarity ≥ 0.3
3. **Augment (Server)** — รวม 5 สินค้าที่เกี่ยวข้อง + System Prompt + คำถาม เป็น prompt เดียว
4. **Generate (Server)** — ส่ง prompt ไป Gemini API → stream คำตอบกลับ client แบบ real-time (SSE)
5. **Attribute** — แนบ source references (product ID, ชื่อ, similarity %, rank, model info) กลับไปแสดง

---

## โครงสร้างโปรเจกต์

```
.
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root Layout (Geist fonts, metadata, lang="th")
│   ├── page.tsx                      # "/" → redirect ไป /chat
│   ├── globals.css                   # Global Styles (dark theme, Tailwind v4)
│   ├── chat/
│   │   └── page.tsx                  # หน้า Chat หลัก (orchestrates all UI)
│   └── api/
│       ├── chat/route.ts             # POST: RAG Pipeline (embed query + retrieve + stream)
│       ├── health/route.ts           # GET: ตรวจสถานะระบบ
│       └── knowledge/
│           ├── route.ts              # GET: สถานะ KB / POST: append custom products
│           └── upload/route.ts       # POST: Upload JSON file + re-embed
│
├── scripts/
│   └── pre-embed.ts                  # ★ Build-time: สร้าง embeddings.json จาก KB
│
├── components/
│   ├── chat/                         # Chat UI Components
│   │   ├── ChatContainer.tsx         # Container หลัก (messages + input + suggestions)
│   │   ├── ChatInput.tsx             # Input field + send button (auto-resize)
│   │   ├── ChatMessage.tsx           # Wrapper แสดง message + sources + inline suggestions
│   │   ├── ChatBubble.tsx            # Bubble style (user=sky, bot=glass)
│   │   ├── TypingIndicator.tsx       # Animated dots ขณะ AI กำลังตอบ
│   │   ├── SourceReference.tsx       # Badge แสดงสินค้า + similarity % + Match Analysis
│   │   └── SuggestedQuestions.tsx     # คำถามแนะนำ (6 ข้อ)
│   │
│   ├── knowledge/                    # Knowledge Base Management
│   │   ├── KnowledgeManager.tsx      # Sidebar panel จัดการ KB
│   │   ├── JsonUploader.tsx          # Drag & Drop upload JSON + capacity bar
│   │   └── DataPreview.tsx           # Preview สินค้า (ค้นหา + กรองหมวดหมู่)
│   │
│   ├── layout/                       # Layout Components
│   │   ├── Header.tsx                # Header (status dot, product count, KB toggle)
│   │   ├── Sidebar.tsx               # Animated right sidebar wrapper (KB panel)
│   │   ├── ChatSidebar.tsx           # Left sidebar (conversation history)
│   │   └── ThreeBackground.tsx       # Canvas 2D animated particle background
│   │
│   └── ui/                           # Reusable UI Components
│       ├── Button.tsx                # Button (variants: default/secondary/ghost/outline)
│       ├── Card.tsx                  # Card container (glass effect, optional glow)
│       ├── Badge.tsx                 # Badge (variants: default/success/warning/info)
│       ├── ProductModal.tsx          # Product detail modal + Match Analysis
│       ├── ScrollArea.tsx            # Custom scrollbar wrapper
│       ├── Skeleton.tsx              # Loading skeleton
│       └── Toast.tsx                 # Toast notifications (context provider)
│
├── hooks/                            # Custom React Hooks
│   ├── useChat.ts                    # Chat state + streaming SSE (ส่งแค่ text, ไม่ embed)
│   ├── useChatHistory.ts            # Conversation CRUD (IndexedDB)
│   ├── useKnowledge.ts              # KB upload + custom products + clear
│   └── useScrollToBottom.ts         # Auto-scroll เมื่อมี message ใหม่
│
├── lib/                              # Core Libraries
│   ├── rag/                          # RAG Pipeline Core
│   │   ├── pipeline.ts              # ★ Orchestrator: embed query → retrieve → augment → generate
│   │   ├── embedding-service.ts     # ★ Server-side Google gemini-embedding-001
│   │   ├── retriever.ts             # ★ Cosine similarity search + filters
│   │   ├── generator.ts             # ★ Gemini API (stream + non-stream) + GeminiError
│   │   ├── chunker.ts               # Product → text chunk conversion
│   │   └── prompt-template.ts       # System prompt + augmented prompt builder
│   │
│   ├── knowledge/                    # Knowledge Base Management
│   │   ├── knowledge-store.ts       # โหลด pre-computed embeddings.json
│   │   ├── json-loader.ts           # Load KB from file / parse JSON string
│   │   └── schema-validator.ts      # Zod v4 schema validation
│   │
│   ├── db/                           # Client-side Storage (IndexedDB)
│   │   ├── indexed-db.ts            # IndexedDB wrapper (2 stores: history, products)
│   │   ├── chat-history.ts          # Conversation CRUD operations
│   │   └── custom-products.ts       # Custom product persistence
│   │
│   └── utils/                        # Utilities
│       ├── constants.ts              # Defaults (TOP_K, THRESHOLD, models, questions, MAX=500)
│       ├── cn.ts                     # clsx + tailwind-merge helper
│       └── format.ts                # Format: price, number, similarity, generateId
│
├── types/                            # TypeScript Type Definitions
│   ├── chat.ts                       # Message, ChatState, SourceReference, Conversation
│   ├── knowledge.ts                  # Product, KnowledgeBase, Chunk, EmbeddedChunk
│   └── rag.ts                        # RAGResult, RAGOptions, RetrievalResult, PipelineStatus
│
├── public/data/
│   ├── shopee-products-knowledge-base.json   # ★ Knowledge Base (100 สินค้า, 15 หมวดหมู่)
│   ├── embeddings.json                       # ★ Pre-computed vectors (100 × 3072-dim, ~4MB)
│   └── metadata.json                         # Metadata ของ KB
│
├── next.config.ts                    # Empty config (Turbopack is default in Next.js 16)
├── tsconfig.json                     # TypeScript config (paths: @/* → ./*)
├── postcss.config.mjs                # PostCSS + @tailwindcss/postcss
├── eslint.config.mjs                 # ESLint (core-web-vitals + typescript)
├── package.json                      # Dependencies & scripts
└── .env.local                        # API Keys & configuration
```

### สิ่งที่เปลี่ยนจาก Client-side Architecture

```
❌ ลบออก                              ✅ เพิ่ม/แก้ไข
─────────────────────────────         ─────────────────────────────
@huggingface/transformers             scripts/pre-embed.ts (build-time)
lib/rag/embeddings-client.ts          lib/rag/embedding-service.ts (Google API)
lib/rag/embedding.ts (stub)           public/data/embeddings.json (static)
lib/db/embedding-cache.ts             —
hooks/useRAG.ts                       —
hooks/useEmbedding.ts                 —
components/knowledge/EmbeddingStatus  —
app/api/embed/route.ts (410 Gone)     —
```

---

## API Routes

### `POST /api/chat`

RAG Pipeline หลัก — รับคำถาม → embed → ค้นหา → สร้างคำตอบ (ทุกอย่างทำบน server)

```typescript
// Request — ส่งแค่ข้อความ ไม่ต้องส่ง vector
{
  message: "หูฟังตัดเสียงรบกวนตัวไหนดี?",
  stream: true,                         // true = SSE streaming
  options?: { topK?: 5, temperature?: 0.7 }
}

// Response (stream = true) → Server-Sent Events
data: {"type":"sources","data":"[{productId,productName,similarity,...}]"}
data: {"type":"text","data":"จากข้อมูลสินค้า..."}
data: {"type":"text","data":"แนะนำ AirPods Pro 3..."}
data: {"type":"done","data":""}

// Response (stream = false) → JSON
{
  answer: "จากข้อมูลสินค้า...",
  sources: [{ productId, productName, similarity, category, price, rank, ... }],
  confidence: 0.82
}
```

> **หมายเหตุ**: ไม่ต้องส่ง `queryVector` จาก client อีกต่อไป — server จะ embed query เองผ่าน `gemini-embedding-001`

### `GET /api/knowledge`

ดึงสถานะ Knowledge Base + รายการสินค้า

```typescript
{
  isInitialized: true,
  productsCount: 100,
  embeddingsCount: 100,
  products: Product[]
}
```

### `POST /api/knowledge`

จัดการ Knowledge Base — รองรับ append, reset, remove custom products

```typescript
// เพิ่มสินค้าใหม่ (server จะ embed ให้)
{ action: "append", products: Product[] }
→ { success, added, skipped, total, baseProductsCount, customProductsCount }

// รีเซ็ตเป็น base products (ลบ custom ทั้งหมดออกจาก RAM)
{ action: "reset" }
→ { success, productsCount, baseProductsCount, customProductsCount: 0 }

// ลบ custom product รายตัว
{ action: "remove", productId: "string" }
→ { success, productsCount, baseProductsCount, customProductsCount }
```

### `POST /api/knowledge/upload`

Upload ไฟล์ JSON ใหม่ (multipart/form-data) — server จะ embed ให้ทั้งหมด

```typescript
// Response
{ success: true, documentsCount: 50, embeddingsCount: 50 }
```

### `GET /api/health`

ตรวจสอบสถานะระบบ

```typescript
{
  status: "ok",
  embeddingMode: "server-side (pre-computed)",
  embeddingModel: "gemini-embedding-001",
  embeddingDimensions: 3072,
  geminiModel: "gemini-2.0-flash",
  knowledgeBaseSize: 100,
  embeddingsCount: 100,
  isReady: true,
  baseProductsCount: 100,
  customProductsCount: 0,
  maxProducts: 500
}
```

---

## UI Components

### Component Hierarchy

```
RootLayout (app/layout.tsx)
└── ChatPage (app/chat/page.tsx)
    ├── ThreeBackground          ← Canvas 2D animated particle background
    └── ToastProvider
        ├── ChatSidebar          ← Left panel: conversation history (IndexedDB)
        ├── Header               ← Status dot + product count + KB toggle + new chat
        ├── ChatContainer
        │   ├── ScrollArea
        │   │   ├── Welcome      ← SVG bot + ข้อความต้อนรับ (เมื่อยังไม่มี message)
        │   │   ├── ChatMessage[]
        │   │   │   ├── ChatBubble (user = sky-tint, bot = glass)
        │   │   │   ├── SourceReference (badges → click เปิด ProductModal)
        │   │   │   └── Inline Suggestions (เมื่อไม่พบผลลัพธ์)
        │   │   └── TypingIndicator (animated dots + "กำลังค้นหาคำตอบ...")
        │   ├── SuggestedQuestions ← 6 คำถามแนะนำ
        │   └── ChatInput         ← Auto-resize textarea + Send button
        └── Sidebar (right)
            └── KnowledgeManager
                ├── JsonUploader  ← Drag & Drop zone + capacity bar
                └── DataPreview   ← ค้นหา + กรองหมวดหมู่ + ProductModal
```

> **หมายเหตุ**: ไม่มี `EmbeddingStatus` step-based progress bar อีกต่อไป — เปิดเว็บมาพร้อมใช้ทันที

### Design System

- **Theme**: Dark mode (`--background: #09090b`, `--foreground: #fafafa`)
- **Accent**: Orange-Red gradient (`from-orange-500 to-red-500`) — Shopee branding
- **Glass Effect**: `bg-white/5 backdrop-blur-xl border-white/10`
- **Animations**: Framer Motion (slide-up messages, bouncing dots, fade transitions)
- **Font**: Geist Sans + Geist Mono (via `next/font`)
- **Scrollbar**: Custom slim 4px scrollbar

---

## Data Flow

### Build Time — Pre-compute Embeddings

```
npm run build
    │
    ├─ 1. npm run pre-embed (scripts/pre-embed.ts)
    │      │
    │      ├─ อ่าน public/data/shopee-products-knowledge-base.json
    │      ├─ แปลง 100 สินค้า → 100 text chunks
    │      ├─ เรียก Google gemini-embedding-001 API (batch)
    │      ├─ สร้าง 100 × 3072-dim vectors
    │      └─ บันทึก public/data/embeddings.json (~4MB)
    │
    └─ 2. next build
           └─ embeddings.json ถูก bundle เป็น static asset
```

### Runtime — Chat Message Flow (เปิดเว็บพร้อมใช้ทันที)

```
User พิมพ์คำถาม
    │
    ▼
ChatInput.tsx → useChat.sendMessage()
    │
    ▼ POST /api/chat { message, stream: true }
    │                                    ← ส่งแค่ text ไม่ต้องส่ง vector
    │
    ├─ embedQuery(message)               ←── Server: gemini-embedding-001 (~200ms)
    │   └─ 3072-dim queryVector
    │
    ├─ loadEmbeddings()                  ←── Server: import embeddings.json (static)
    │
    ├─ retrieveTopK(queryVector, embeddings)
    │   └─ cosine similarity → filter ≥ 0.3 → sort → top-5
    │
    ├─ buildAugmentedPrompt(question, top5Results)
    │   └─ System Prompt + 5 Product Chunks + Question
    │
    ├─ SSE: {"type":"sources", "data":"[...]"}  ──→ SourceReference badges
    │
    ├─ generateResponseStream(prompt)               ←── Gemini API
    │   └─ SSE: {"type":"text", "data":"..."} ──→ ChatBubble (real-time)
    │
    └─ SSE: {"type":"done"}  ──→ isStreaming = false
                                  └─ บันทึกสนทนาลง IndexedDB
```

### Custom Product Upload Flow

```
User drops JSON file
    │
    ▼
Zod validation (client-side)
    │
    ├─ saveCustomProducts() → IndexedDB (persist across refresh)
    │
    └─ POST /api/knowledge { action: "append", products: Product[] }
        │
        ├─ productsToChunks()
        ├─ embedBatch(chunkTexts)  ←── Server: gemini-embedding-001
        └─ appendToRuntime()       ←── เก็บใน serverless function memory
                                       (หายเมื่อ cold start → re-append จาก IndexedDB)
```

### เปรียบเทียบ UX ก่อน-หลัง

```
──── ก่อน (Client-side WASM) ────────────────────
เปิดเว็บ → [Checking...]
         → [Loading Knowledge Base...] 1-2s
         → [Loading AI Model...] 15-45s  ← ❌ คอขวด!
         → [Creating Embeddings...] 5-10s
         → [Storing Vectors...] 1s
         → ✅ Ready                Total: 30-60 วินาที

──── หลัง (Pre-computed Build Time) ─────────────
เปิดเว็บ → ✅ Ready                Total: <1 วินาที
```

---

## Knowledge Base

### `shopee-products-knowledge-base.json`

| สถิติ | ค่า |
|-------|-----|
| สินค้าทั้งหมด | 100 รายการ |
| หมวดหมู่ | 15 หมวด |
| แบรนด์ | 70+ แบรนด์ |
| ช่วงราคา | ฿99 – ฿62,990 |
| ราคาเฉลี่ย | ฿9,343 |
| จำนวนสูงสุดที่รองรับ | 500 สินค้า (base + custom) |

### 15 หมวดหมู่

`automotive` · `baby-kids` · `beauty` · `computing` · `electronics` · `fashion-men` · `fashion-women` · `food-beverage` · `gaming` · `health` · `home-appliances` · `pet-supplies` · `smartphones` · `sports` · `stationery`

### Chunking Strategy

**1 สินค้า = 1 Chunk** — รวมทุก field เป็นข้อความเดียว:

```
[iPhone 16 Pro Max 256GB] สมาร์ทโฟน Apple iPhone 16 Pro Max...
หมวดหมู่: smartphones | แบรนด์: Apple
ราคา: ฿52,900 (ลด -4%) | ราคาเดิม: ฿54,900 | ขายแล้ว: 12,500 ชิ้น | ⭐ 4.9
ร้าน: Apple Official Store (กรุงเทพมหานคร) [Shopee Mall] [ส่งฟรี]
สเปค: screen: 6.9 นิ้ว, chip: A18 Pro, ram: 8GB, storage: 256GB, ...
แท็ก: iphone, apple, smartphone, 5g, flagship
รับประกัน: รับประกันศูนย์ไทย 1 ปี | คืนสินค้า: คืนสินค้าได้ภายใน 15 วัน
```

### Product Schema

```typescript
interface Product {
  id: string;              // "prod-001"
  name: string;            // ชื่อสินค้า
  description: string;     // รายละเอียด
  price: number;           // ราคาขาย (บาท)
  originalPrice: number;   // ราคาเดิม
  discount: string | null; // "-4%"
  soldCount: number;       // ยอดขาย
  rating: number;          // คะแนน 0-5
  shopName: string;        // ชื่อร้าน
  shopLocation: string;    // ที่ตั้งร้าน
  isMall: boolean;         // Shopee Mall
  isPreferred: boolean;    // Preferred Seller
  freeShipping: boolean;   // ส่งฟรี
  category: string;        // หมวดหมู่
  brand: string;           // แบรนด์
  tags: string[];          // แท็ก
  specs: Record<string, string | number | boolean>;  // สเปค
  warranty: string;        // รับประกัน
  returnPolicy: string;    // นโยบายคืนสินค้า
}
```

### Pre-computed Embedding Schema

```typescript
// public/data/embeddings.json
interface EmbeddedProduct {
  text: string;            // chunk text (ข้อความรวมของสินค้า)
  metadata: {
    productId: string;
    productName: string;
    category: string;
    brand: string;
    price: number;
  };
  vector: number[];        // 3072-dim embedding from gemini-embedding-001
}

type EmbeddingsFile = EmbeddedProduct[];  // 100 items, ~4MB
```

---

## Data Persistence

| ข้อมูล | ที่เก็บ | คงอยู่หลัง Refresh? | คงอยู่หลัง Deploy? |
|--------|--------|-------------------|-------------------|
| Base product vectors | `embeddings.json` (static file) | ✅ | ✅ |
| Custom products | IndexedDB `custom-products` | ✅ | ✅ |
| Chat history | IndexedDB `chat-history` | ✅ | ✅ |
| Custom product vectors | Serverless function memory | ⚠️ (หายเมื่อ cold start) | ❌ (re-embed จาก IndexedDB) |

> **หมายเหตุ**: Base products ถูก pre-compute เป็น static file จึงไม่หายเลย ส่วน custom products จะถูก re-sync อัตโนมัติเมื่อ cold start จาก IndexedDB ฝั่ง client (เรียก `append` ใหม่ → server re-embed ให้)
>
> - **ล้างทั้งหมด**: `action: "reset"` → server คืนเป็น base snapshot + ล้าง IndexedDB
> - **ลบรายตัว**: `action: "remove"` + `productId` → server ลบจาก 3 arrays + ล้าง IndexedDB entry

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```env
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=gemini-embedding-001
TOP_K=5
SIMILARITY_THRESHOLD=0.3
MAX_CONTEXT_LENGTH=4000
```

> **หมายเหตุ**: ใช้ `GOOGLE_API_KEY` ตัวเดียวสำหรับทั้ง Embedding (`gemini-embedding-001`) และ Generation (`gemini-2.0-flash`)

### 3. Pre-compute Embeddings (ครั้งแรก หรือเมื่อแก้ไข KB)

```bash
npm run pre-embed
```

สร้างไฟล์ `public/data/embeddings.json` (~4MB, 100 สินค้า × 3072 dimensions)

### 4. Run Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) → จะ redirect ไป `/chat`

> ⚡ **เปิดเว็บมาพร้อมใช้ทันที** — ไม่ต้องรอโหลด AI Model หรือสร้าง Embeddings

### 5. Build for Production

```bash
npm run build    # รวม pre-embed + next build
npm start
```

### 6. Deploy to Vercel

```bash
vercel deploy
```

- ✅ ใช้ได้ทุก Plan (Hobby, Pro, Enterprise)
- ✅ `pre-embed` รันตอน build อัตโนมัติ
- ✅ ไม่ต้อง persistent memory

### Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "pre-embed": "tsx scripts/pre-embed.ts",
    "build": "npm run pre-embed && next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## Environment Variables

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|--------|-----------|---------|
| `GOOGLE_API_KEY` | — | **(จำเป็น)** Google API Key สำหรับ Embedding + Generation |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Model ที่ใช้สร้างคำตอบ |
| `EMBEDDING_MODEL` | `gemini-embedding-001` | Model สำหรับ embedding (Google API) |
| `TOP_K` | `5` | จำนวนสินค้าที่ดึงมาเป็น context |
| `SIMILARITY_THRESHOLD` | `0.3` | คะแนน cosine similarity ขั้นต่ำ |
| `MAX_CONTEXT_LENGTH` | `4000` | ความยาวสูงสุดของ context (tokens) |

### Embedding Model เปรียบเทียบ

| คุณสมบัติ | `gemini-embedding-001` (ใช้อยู่) | `Xenova/all-MiniLM-L6-v2` (เดิม) |
|-----------|-------------------------------|----------------------------------|
| ทำงานที่ | Server (Google API) | Browser (WASM) |
| Dimensions | 3072 | 384 |
| ภาษาไทย | ✅ ดีมาก | ⚠️ พอใช้ |
| Max Tokens | 2,048 | 256 |
| ขนาด Download | ไม่ต้องโหลด | ~118MB |
| ค่าใช้จ่าย | ฟรี tier + จ่ายเพิ่ม | ฟรีตลอด |
| เวลาเปิดเว็บ | ⚡ <1 วินาที | ⏳ 30-60 วินาที |
