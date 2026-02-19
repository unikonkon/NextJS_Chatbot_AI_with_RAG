# Shopee AI Shopping Assistant — RAG Chatbot

AI Chatbot สำหรับค้นหา เปรียบเทียบ และแนะนำสินค้ายอดนิยมจาก Shopee Thailand
สร้างด้วย **Next.js 16** + **RAG (Retrieval-Augmented Generation)** Pipeline
Embedding ทำงานฝั่ง **Client-Side** (Browser/WASM) — Deploy ได้บน Vercel โดยไม่ต้องพึ่ง ONNX Runtime ฝั่ง Server

---

## สารบัญ

- [Features](#features)
- [Tech Stack](#tech-stack)
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
| idb | 8 | IndexedDB Wrapper (Chat History, Custom Products, Cache) |

### Backend / AI / ML
| Library | บทบาท |
|---------|-------|
| `@huggingface/transformers` | Embedding Model (**client-side**, browser/WASM) |
| `@google/generative-ai` | Gemini API สร้างคำตอบ (server-side) |
| `ml-distance` | Cosine Similarity สำหรับ Semantic Search (server-side) |
| `zod` (v4) | Schema Validation สำหรับ Knowledge Base |

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
│  │ 1. EMBED QUERY     │  HuggingFace Transformers            │
│  │    (CLIENT-SIDE)   │  Browser/WASM                        │
│  │    แปลงคำถามเป็น    │  paraphrase-multilingual-MiniLM      │
│  │    384-dim vector   │  pooling=mean, normalize=true        │
│  └────────┬───────────┘                                      │
│           │ queryVector (sent to server)                      │
│           ▼                                                  │
│  ┌────────────────────┐    ┌─────────────────────────┐       │
│  │ 2. RETRIEVE        │◄───│ Knowledge Store          │       │
│  │    (SERVER-SIDE)   │    │ In-memory singleton      │       │
│  │    Cosine Similarity│    │ 100+ products (embedded) │       │
│  │    Top-K = 5        │    └─────────────────────────┘       │
│  │    Threshold ≥ 0.3  │                                      │
│  └────────┬───────────┘                                      │
│           │ top-5 relevant chunks                            │
│           ▼                                                  │
│  ┌────────────────────┐                                      │
│  │ 3. AUGMENT         │  System Prompt (Thai Shopping AI)    │
│  │    สร้าง prompt      │  + Context (5 สินค้าที่เกี่ยวข้อง)    │
│  │    รวม context       │  + User Question                    │
│  └────────┬───────────┘                                      │
│           │ augmented prompt                                 │
│           ▼                                                  │
│  ┌────────────────────┐                                      │
│  │ 4. GENERATE        │  Google Gemini API (server-side)     │
│  │    สร้างคำตอบ        │  Streaming Response (SSE)            │
│  │    + Source Refs    │  temp=0.7, maxTokens=2048            │
│  └────────┬───────────┘                                      │
│           │                                                  │
│           ▼                                                  │
│  [AI Response + Source References + Match Analysis]           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### ขั้นตอนย่อ

1. **Embed (Client)** — แปลงคำถาม user เป็น vector 384 มิติ ด้วย HuggingFace `paraphrase-multilingual-MiniLM-L12-v2` **ใน Browser ผ่าน WASM**
2. **Retrieve (Server)** — รับ `queryVector` จาก client → คำนวณ Cosine Similarity กับ product vectors ใน memory → เลือก Top-5 ที่ similarity ≥ 0.3
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
│       ├── chat/route.ts             # POST: RAG Pipeline (stream/non-stream)
│       ├── embed/route.ts            # POST: ปิดใช้งาน (410 Gone) — ใช้ client-side แทน
│       ├── health/route.ts           # GET: ตรวจสถานะระบบ
│       └── knowledge/
│           ├── route.ts              # GET: สถานะ KB / POST: load/store-vectors/append
│           └── upload/route.ts       # POST: Upload JSON file
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
│   │   ├── DataPreview.tsx           # Preview สินค้า (ค้นหา + กรองหมวดหมู่)
│   │   └── EmbeddingStatus.tsx       # แสดงสถานะ loading/error/progress (step-based)
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
│   ├── useChat.ts                    # Chat state + streaming SSE + client-side embedding
│   ├── useChatHistory.ts            # Conversation CRUD (IndexedDB)
│   ├── useRAG.ts                     # RAG initialization + health check + init steps
│   ├── useKnowledge.ts              # KB upload + custom products + clear
│   ├── useEmbedding.ts              # Client-side embedding wrapper
│   └── useScrollToBottom.ts         # Auto-scroll เมื่อมี message ใหม่
│
├── lib/                              # Core Libraries
│   ├── rag/                          # RAG Pipeline Core
│   │   ├── pipeline.ts              # ★ Orchestrator: retrieve → augment → generate
│   │   ├── embeddings-client.ts     # ★ Client-side HuggingFace WASM embedding
│   │   ├── embedding.ts             # Server-side stub (boolean flag เท่านั้น)
│   │   ├── retriever.ts             # ★ Cosine similarity search + filters
│   │   ├── generator.ts             # ★ Gemini API (stream + non-stream) + GeminiError
│   │   ├── chunker.ts               # Product → text chunk conversion
│   │   └── prompt-template.ts       # System prompt + augmented prompt builder
│   │
│   ├── knowledge/                    # Knowledge Base Management
│   │   ├── knowledge-store.ts       # Singleton store (products, chunks, embeddings, max 500)
│   │   ├── json-loader.ts           # Load KB from file / parse JSON string
│   │   └── schema-validator.ts      # Zod v4 schema validation
│   │
│   ├── db/                           # Client-side Storage (IndexedDB)
│   │   ├── indexed-db.ts            # IndexedDB wrapper (3 stores: cache, history, products)
│   │   ├── chat-history.ts          # Conversation CRUD operations
│   │   ├── custom-products.ts       # Custom product persistence
│   │   └── embedding-cache.ts       # Embedding cache interface
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
│   └── metadata.json                         # Metadata ของ KB
│
├── next.config.ts                    # Empty config (Turbopack is default in Next.js 16)
├── tsconfig.json                     # TypeScript config (paths: @/* → ./*)
├── postcss.config.mjs                # PostCSS + @tailwindcss/postcss
├── eslint.config.mjs                 # ESLint (core-web-vitals + typescript)
├── package.json                      # Dependencies & scripts
└── .env.local                        # API Keys & configuration
```

---

## API Routes

### `POST /api/chat`

RAG Pipeline หลัก — รับคำถาม + queryVector → ค้นหา → สร้างคำตอบ

```typescript
// Request
{
  message: "หูฟังตัดเสียงรบกวนตัวไหนดี?",
  queryVector: number[384],             // client-side embedding (จำเป็น)
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

> **หมายเหตุ**: ต้องส่ง `queryVector` ที่ embed ฝั่ง client มาด้วย ไม่เช่นนั้นจะได้ 400 Bad Request

### `POST /api/embed` (ปิดใช้งาน)

ส่งกลับ HTTP 410 Gone — Embedding ทำฝั่ง client ทั้งหมด

### `GET /api/knowledge`

ดึงสถานะ Knowledge Base + รายการสินค้า

```typescript
{
  isInitialized: true,
  productsCount: 100,
  chunksCount: 100,
  embeddingsCount: 100,
  products: Product[]
}
```

### `POST /api/knowledge`

จัดการ Knowledge Base — รองรับ 4 actions:

```typescript
// โหลด KB จากไฟล์ → ส่ง chunkTexts กลับให้ client embed
{ action: "initialize" }  → { chunkTexts: string[] }
{ action: "load" }        → { chunkTexts: string[] }

// รับ vectors ที่ client embed แล้ว → เก็บใน memory
{ action: "store-vectors", vectors: number[][] }
→ { embeddingsCount, productsCount, isReady: true }

// เพิ่มสินค้าใหม่ (พร้อม vectors ที่ embed แล้ว)
{ action: "append", products: Product[], vectors: number[][] }
→ { productsCount, chunksCount, embeddingsCount }
```

### `POST /api/knowledge/upload`

Upload ไฟล์ JSON ใหม่ (multipart/form-data)

```typescript
// Response → ส่ง chunkTexts กลับให้ client embed
{ success: true, documentsCount: 100, chunksCount: 100, chunkTexts: string[] }
```

### `GET /api/health`

ตรวจสอบสถานะระบบ

```typescript
{
  status: "ok",
  embeddingMode: "client-side",
  embeddingModel: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
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
        │   ├── EmbeddingStatus  ← Step-based progress bar (ถ้ายังไม่ ready)
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

### Design System

- **Theme**: Dark mode (`--background: #09090b`, `--foreground: #fafafa`)
- **Accent**: Orange-Red gradient (`from-orange-500 to-red-500`) — Shopee branding
- **Glass Effect**: `bg-white/5 backdrop-blur-xl border-white/10`
- **Animations**: Framer Motion (slide-up messages, bouncing dots, fade transitions)
- **Font**: Geist Sans + Geist Mono (via `next/font`)
- **Scrollbar**: Custom slim 4px scrollbar

---

## Data Flow

### Initialization Flow (Cold Start)

```
Browser                              Server (Next.js)
  │                                      │
  │── GET /api/health ────────────────→  │
  │←── { isReady: false } ───────────── │
  │                                      │
  │  [Step: loading-kb]                  │
  │── POST /api/knowledge ───────────→   │
  │   { action: "initialize" }           │
  │                            loadKnowledgeBaseFromFile()
  │                            productsToChunks()
  │←── { chunkTexts: string[] } ──────  │
  │                                      │
  │  [Step: loading-model]               │
  │  loadModel() — WASM download         │
  │  (~118MB, ครั้งแรกเท่านั้น)             │
  │                                      │
  │  [Step: embedding]                   │
  │  generateEmbeddings(chunkTexts)      │
  │  (384-dim per chunk, sequential)     │
  │                                      │
  │  [Step: storing]                     │
  │── POST /api/knowledge ───────────→   │
  │   { action: "store-vectors",         │
  │     vectors: number[][] }            │
  │                            store.storeVectors(vectors)
  │←── { embeddingsCount, isReady } ──  │
  │                                      │
  │  [Step: custom-products]             │
  │  ดึง custom products จาก IndexedDB    │
  │  embed + POST action="append"        │
  │                                      │
  │  ✅ Ready!                            │
```

> **Fast Path**: ถ้า refresh หน้าแล้ว server ยังเก็บ vectors ไว้ (`GET /api/health` → `isReady: true`) จะข้ามทุกขั้นตอนและพร้อมใช้ทันที

### Chat Message Flow

```
User พิมพ์คำถาม
    │
    ▼
ChatInput.tsx → useChat.sendMessage()
    │
    ├─ generateEmbedding(message)  ←── Client-side (Browser WASM)
    │   └─ 384-dim queryVector
    │
    ▼ POST /api/chat { message, queryVector, stream: true }
    │
    ├─ retrieveTopK(queryVector, embeddedChunks)     ←── Server-side
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
    ├─ productsToChunks() → generateEmbeddings() (Browser WASM)
    │
    └─ POST /api/knowledge { action: "append", products, vectors }
        └─ store.appendProducts() — deduplicate + MAX_PRODUCTS cap (500)
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

---

## Data Persistence

| ข้อมูล | ที่เก็บ | คงอยู่หลัง Refresh? |
|--------|--------|-------------------|
| Product vectors (base KB) | Server memory (singleton) | ✅ (ถ้า server process ยังทำงาน) |
| Custom products | IndexedDB `custom-products` | ✅ (re-embed + append on init) |
| Chat history | IndexedDB `chat-history` | ✅ |
| Embedding cache | IndexedDB `embedding-cache` | ✅ (schema มี แต่ยังไม่ได้ใช้งาน) |
| WASM model | Browser cache | ✅ (หลังดาวน์โหลดครั้งแรก) |

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
EMBEDDING_MODEL=Xenova/paraphrase-multilingual-MiniLM-L12-v2
TOP_K=5
SIMILARITY_THRESHOLD=0.3
MAX_CONTEXT_LENGTH=4000
```

### 3. Run Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) → จะ redirect ไป `/chat`

> **หมายเหตุ**: การเปิดครั้งแรกจะใช้เวลา 30-60 วินาทีในการดาวน์โหลด Embedding Model (~118MB) และสร้าง embeddings สำหรับ 100 สินค้า ครั้งต่อไป model จะถูก cache ใน browser

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|--------|-----------|---------|
| `GOOGLE_GEMINI_API_KEY` | — | **(จำเป็น)** API Key ของ Google Gemini |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Model ที่ใช้สร้างคำตอบ |
| `EMBEDDING_MODEL` | `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | Model สำหรับ embedding (client-side) |
| `TOP_K` | `5` | จำนวนสินค้าที่ดึงมาเป็น context |
| `SIMILARITY_THRESHOLD` | `0.3` | คะแนน cosine similarity ขั้นต่ำ |
| `MAX_CONTEXT_LENGTH` | `4000` | ความยาวสูงสุดของ context (tokens) |

### Embedding Model ที่รองรับ

| Model | Dimensions | ภาษาไทย | ขนาด |
|-------|-----------|---------|------|
| `Xenova/all-MiniLM-L6-v2` | 384 | พอใช้ | ~23MB |
| `Xenova/multilingual-e5-small` | 384 | ดี | ~118MB |
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | 384 | ดีมาก | ~118MB |
