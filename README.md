# Shopee AI Shopping Assistant — RAG Chatbot

AI Chatbot สำหรับค้นหา เปรียบเทียบ และแนะนำสินค้ายอดนิยมจาก Shopee Thailand
สร้างด้วย **Next.js 16** + **RAG (Retrieval-Augmented Generation)** Pipeline

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
- Source Attribution แสดง similarity score ของสินค้าที่อ้างอิง
- Upload JSON Knowledge Base ผ่าน Drag & Drop
- Animated Background (Canvas particle effect)
- รองรับภาษาไทยและอังกฤษ

---

## Tech Stack

### Frontend
| Library | เวอร์ชัน | บทบาท |
|---------|---------|-------|
| Next.js | 16.1.6 | Framework (App Router + Turbopack) |
| React | 19.2.3 | UI Library |
| TypeScript | 5 | Type Safety |
| Tailwind CSS | 4 | Styling |
| Framer Motion | 12.23.26 | Animations |
| Lucide React | 0.562.0 | Icons |
| class-variance-authority | 0.7.1 | Component Variants |
| clsx + tailwind-merge | — | Conditional ClassNames |
| react-dropzone | — | File Upload |

### Backend / AI / ML
| Library | บทบาท |
|---------|-------|
| `@huggingface/transformers` | Embedding Model (server-side, multilingual) |
| `@google/generative-ai` | Gemini API สร้างคำตอบ |
| `ml-distance` | Cosine Similarity สำหรับ Semantic Search |
| `zod` | Schema Validation สำหรับ Knowledge Base |
| `idb` | IndexedDB Wrapper (Embedding Cache) |

---

## RAG Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    RAG Pipeline Overview                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  [User Question]                                               │
│       │                                                        │
│       ▼                                                        │
│  ┌────────────────────┐                                        │
│  │ 1. EMBED QUERY     │  HuggingFace Transformers              │
│  │    แปลงคำถามเป็น    │  (paraphrase-multilingual-MiniLM)      │
│  │    384-dim vector   │  pooling=mean, normalize=true          │
│  └────────┬───────────┘                                        │
│           │ query vector                                       │
│           ▼                                                    │
│  ┌────────────────────┐    ┌─────────────────────────┐         │
│  │ 2. RETRIEVE        │◄───│ Knowledge Store          │         │
│  │    Cosine Similarity│    │ 100 products (embedded)  │         │
│  │    Top-K = 5        │    └─────────────────────────┘         │
│  │    Threshold ≥ 0.3  │                                        │
│  └────────┬───────────┘                                        │
│           │ top-5 relevant chunks                              │
│           ▼                                                    │
│  ┌────────────────────┐                                        │
│  │ 3. AUGMENT         │  System Prompt (Thai Shopping AI)      │
│  │    สร้าง prompt      │  + Context (5 สินค้าที่เกี่ยวข้อง)      │
│  │    รวม context       │  + User Question                      │
│  └────────┬───────────┘                                        │
│           │ augmented prompt                                   │
│           ▼                                                    │
│  ┌────────────────────┐                                        │
│  │ 4. GENERATE        │  Google Gemini API                     │
│  │    สร้างคำตอบ        │  Streaming Response (SSE)              │
│  │    + Source Refs    │  temp=0.7, maxTokens=2048              │
│  └────────┬───────────┘                                        │
│           │                                                    │
│           ▼                                                    │
│  [AI Response + Source References + Confidence Score]           │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### ขั้นตอนย่อ

1. **Embed** — แปลงคำถาม user เป็น vector 384 มิติ ด้วย HuggingFace `paraphrase-multilingual-MiniLM-L12-v2`
2. **Retrieve** — คำนวณ Cosine Similarity ระหว่าง query vector กับ 100 product vectors → เลือก Top-5 ที่ similarity ≥ 0.3
3. **Augment** — รวม 5 สินค้าที่เกี่ยวข้อง + System Prompt + คำถาม เป็น prompt เดียว
4. **Generate** — ส่ง prompt ไป Gemini API → stream คำตอบกลับ client แบบ real-time
5. **Attribute** — แนบ source references (product ID, ชื่อ, similarity %) กลับไปแสดง

---

## โครงสร้างโปรเจกต์

```
.
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root Layout (metadata, fonts)
│   ├── page.tsx                      # "/" → redirect ไป /chat
│   ├── globals.css                   # Global Styles (dark theme)
│   ├── chat/
│   │   └── page.tsx                  # หน้า Chat หลัก
│   └── api/
│       ├── chat/route.ts             # POST: RAG Pipeline (stream/non-stream)
│       ├── embed/route.ts            # POST: สร้าง embedding vector
│       ├── health/route.ts           # GET: ตรวจสถานะระบบ
│       └── knowledge/
│           ├── route.ts              # GET: สถานะ KB / POST: load/embed/initialize
│           └── upload/route.ts       # POST: Upload JSON file
│
├── components/
│   ├── chat/                         # Chat UI Components
│   │   ├── ChatContainer.tsx         # Container หลัก (messages + input + suggestions)
│   │   ├── ChatInput.tsx             # Input field + send button (auto-resize)
│   │   ├── ChatMessage.tsx           # Wrapper แสดง message + sources
│   │   ├── ChatBubble.tsx            # Bubble style (user=orange, bot=glass)
│   │   ├── TypingIndicator.tsx       # Animated dots ขณะ AI กำลังตอบ
│   │   ├── SourceReference.tsx       # Badge แสดงสินค้าที่อ้างอิง + similarity %
│   │   └── SuggestedQuestions.tsx     # คำถามแนะนำ (6 ข้อ)
│   │
│   ├── knowledge/                    # Knowledge Base Management
│   │   ├── KnowledgeManager.tsx      # Sidebar panel จัดการ KB
│   │   ├── JsonUploader.tsx          # Drag & Drop upload JSON
│   │   ├── DataPreview.tsx           # Preview รายการสินค้าใน KB
│   │   └── EmbeddingStatus.tsx       # แสดงสถานะ loading/error/progress
│   │
│   ├── layout/                       # Layout Components
│   │   ├── Header.tsx                # Header (status indicator, KB toggle, clear)
│   │   ├── Sidebar.tsx               # Animated sidebar wrapper
│   │   └── ThreeBackground.tsx       # Canvas animated particle background
│   │
│   └── ui/                           # Reusable UI Components
│       ├── Button.tsx                # Button (variants: default/secondary/ghost/outline)
│       ├── Card.tsx                  # Card container (glass effect)
│       ├── Badge.tsx                 # Badge (variants: default/success/warning/info)
│       ├── ScrollArea.tsx            # Custom scrollbar
│       ├── Skeleton.tsx              # Loading skeleton
│       └── Toast.tsx                 # Toast notifications (context provider)
│
├── hooks/                            # Custom React Hooks
│   ├── useChat.ts                    # Chat state + streaming SSE + message management
│   ├── useRAG.ts                     # RAG initialization + health check
│   ├── useKnowledge.ts              # KB upload + status fetching
│   ├── useEmbedding.ts              # Embedding API wrapper
│   └── useScrollToBottom.ts         # Auto-scroll เมื่อมี message ใหม่
│
├── lib/                              # Core Libraries
│   ├── rag/                          # RAG Pipeline Core
│   │   ├── pipeline.ts              # ★ Orchestrator: embed → retrieve → generate
│   │   ├── embedding.ts             # ★ HuggingFace embedding (singleton, lazy-load)
│   │   ├── retriever.ts             # ★ Cosine similarity search + filters
│   │   ├── generator.ts             # ★ Gemini API (stream + non-stream)
│   │   ├── chunker.ts               # Product → text chunk conversion
│   │   └── prompt-template.ts       # System prompt + augmented prompt builder
│   │
│   ├── knowledge/                    # Knowledge Base Management
│   │   ├── knowledge-store.ts       # Singleton store (products, chunks, embeddings)
│   │   ├── json-loader.ts           # Load KB from file / parse JSON string
│   │   └── schema-validator.ts      # Zod schema validation
│   │
│   ├── db/                           # Client-side Storage
│   │   ├── indexed-db.ts            # IndexedDB wrapper (idb)
│   │   └── embedding-cache.ts       # Embedding cache interface
│   │
│   └── utils/                        # Utilities
│       ├── constants.ts              # Defaults (TOP_K, THRESHOLD, models, questions)
│       ├── cn.ts                     # clsx + tailwind-merge helper
│       └── format.ts                # Format: price, number, similarity, generateId
│
├── types/                            # TypeScript Type Definitions
│   ├── chat.ts                       # Message, ChatState, SourceReference, ChatRequest/Response
│   ├── knowledge.ts                  # Product, KnowledgeBase, Chunk, EmbeddedChunk
│   └── rag.ts                        # RAGResult, RAGOptions, RetrievalResult, PipelineStatus
│
├── public/data/
│   ├── shopee-products-knowledge-base.json   # ★ Knowledge Base (100 สินค้า, 15 หมวดหมู่)
│   └── metadata.json                         # Metadata ของ KB
│
├── next.config.ts                    # Turbopack + serverExternalPackages
├── tsconfig.json                     # TypeScript config (paths: @/* → ./*)
├── postcss.config.mjs                # PostCSS + Tailwind v4
├── package.json                      # Dependencies & scripts
└── .env.local                        # API Keys & configuration
```

---

## API Routes

### `POST /api/chat`

RAG Pipeline หลัก — รับคำถาม → ค้นหา → สร้างคำตอบ

```typescript
// Request
{
  message: "หูฟังตัดเสียงรบกวนตัวไหนดี?",
  stream: true,                       // true = SSE streaming
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
  sources: [{ productId, productName, similarity, category, price }],
  confidence: 0.82
}
```

### `POST /api/embed`

สร้าง embedding vector จากข้อความ

```typescript
// Single text
{ text: "หูฟังบลูทูธ" }           → { vector: number[384] }

// Batch
{ texts: ["หูฟัง", "โน้ตบุ๊ค"] }  → { vectors: number[2][384] }
```

### `GET/POST /api/knowledge`

จัดการ Knowledge Base

```typescript
// GET → สถานะ KB + รายการสินค้า
{ isInitialized, productsCount, chunksCount, embeddingsCount, products: [...] }

// POST actions:
{ action: "load" }        // โหลด KB จากไฟล์
{ action: "embed" }       // สร้าง embeddings
{ action: "initialize" }  // โหลด + embed (ครบจบ)
```

### `POST /api/knowledge/upload`

Upload ไฟล์ JSON ใหม่ (multipart/form-data)

```typescript
// Response
{ success: true, documentsCount: 100, chunksCount: 100, embeddingsCount: 100 }
```

### `GET /api/health`

ตรวจสอบสถานะระบบ

```typescript
{
  status: "ok",
  embeddingModelLoaded: true,
  embeddingModel: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
  geminiModel: "gemini-2.5-flash-lite",
  knowledgeBaseSize: 100,
  embeddingsCount: 100,
  isReady: true
}
```

---

## UI Components

### Component Hierarchy

```
RootLayout (app/layout.tsx)
└── ChatPage (app/chat/page.tsx)
    ├── ThreeBackground          ← Canvas animated particle background
    └── ToastProvider
        ├── Header               ← Status + KB toggle + Clear chat
        ├── ChatContainer
        │   ├── EmbeddingStatus  ← Loading / Error bar (ถ้ายังไม่ ready)
        │   ├── ScrollArea
        │   │   ├── Welcome      ← ข้อความต้อนรับ (เมื่อยังไม่มี message)
        │   │   ├── ChatMessage[]
        │   │   │   ├── ChatBubble (user = orange gradient, bot = glass)
        │   │   │   └── SourceReference (badges + similarity %)
        │   │   └── TypingIndicator (animated dots)
        │   ├── SuggestedQuestions ← 6 คำถามแนะนำ
        │   └── ChatInput         ← Textarea + Send button
        └── Sidebar
            └── KnowledgeManager
                ├── JsonUploader  ← Drag & Drop zone
                └── DataPreview   ← รายการสินค้าใน KB
```

### Design System

- **Theme**: Dark mode (background `#050505`, text `#ededed`)
- **Accent**: Orange-Red gradient (`from-orange-500 to-red-500`) — Shopee branding
- **Glass Effect**: `bg-white/5 backdrop-blur-xl border-white/10`
- **Animations**: Framer Motion (slide-up messages, bouncing dots, fade transitions)
- **Font**: Geist Sans + Geist Mono (via `next/font`)

---

## Data Flow

```
User พิมพ์คำถาม
    │
    ▼
ChatInput.tsx → useChat.sendMessage()
    │
    ▼ POST /api/chat (stream: true)
    │
    ├─ ensureKnowledgeBase()
    │   └─ ถ้ายังไม่โหลด → loadFromFile() → embedAllChunks()
    │
    ├─ embedText(question) ─── HuggingFace Transformers ──→ query vector [384]
    │
    ├─ retrieveTopK(queryVector, embeddedChunks)
    │   └─ cosine similarity → filter ≥ 0.3 → sort → top-5
    │
    ├─ buildAugmentedPrompt(question, top5Results)
    │   └─ System Prompt + 5 Product Chunks + Question
    │
    ├─ SSE: {"type":"sources", "data":"[...]"}  ──→ SourceReference badges
    │
    ├─ generateResponseStream(prompt)
    │   └─ Gemini API streaming
    │       └─ SSE: {"type":"text", "data":"..."} ──→ ChatBubble (real-time)
    │
    └─ SSE: {"type":"done"}  ──→ isStreaming = false
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

> **หมายเหตุ**: การเปิดครั้งแรกจะใช้เวลา 30-60 วินาทีในการดาวน์โหลด Embedding Model (~118MB) และสร้าง embeddings สำหรับ 100 สินค้า

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
| `EMBEDDING_MODEL` | `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | Model สำหรับ embedding |
| `TOP_K` | `5` | จำนวนสินค้าที่ดึงมาเป็น context |
| `SIMILARITY_THRESHOLD` | `0.3` | คะแนน cosine similarity ขั้นต่ำ |
| `MAX_CONTEXT_LENGTH` | `4000` | ความยาวสูงสุดของ context (tokens) |

### Embedding Model ที่รองรับ

| Model | Dimensions | ภาษาไทย | ขนาด |
|-------|-----------|---------|------|
| `Xenova/all-MiniLM-L6-v2` | 384 | พอใช้ | ~23MB |
| `Xenova/multilingual-e5-small` | 384 | ดี | ~118MB |
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | 384 | ดีมาก | ~118MB |
