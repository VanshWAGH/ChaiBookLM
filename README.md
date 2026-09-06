<div align="center">

# 📚 ChaiBookLM / LexAssist

### *AI-Powered Research & Document Intelligence Platform (NotebookLM Clone)*

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-5-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Clerk Auth](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Inngest](https://img.shields.io/badge/Inngest-Workflows-000000?style=for-the-badge&logo=inngest)](https://www.inngest.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

An end-to-end multimodal AI research notebook inspired by Google NotebookLM. Ingest diverse sources (PDFs, web articles, YouTube videos, and text), perform vector search with **pgvector**, chat with your grounded sources using **streaming RAG with inline citations**, and generate customized Studio artifacts and smart notes.

</div>

---

## 🌟 Key Features

### 📥 1. Multi-Source Ingestion & Processing
- **PDF Documents:** Direct upload via Cloudinary with automatic chunking & text extraction using `unpdf`.
- **Web Pages:** Clean markdown scraping and full-page parsing powered by **Firecrawl**.
- **YouTube Transcripts:** Instant subtitle and transcript extraction for video summaries.
- **Raw Text & Markdown:** Manual notes, pasted snippets, and custom reference documents.

### 🧠 2. Grounded RAG & Real-Time Chat
- **Vector Search (pgvector):** High-dimensional vector embeddings stored directly in PostgreSQL with cosine similarity indexing.
- **Streaming Responses (SSE):** Real-time Server-Sent Events token streaming powered by OpenRouter models (Gemma 4 / Nemotron Embed).
- **Inline Citations:** Every claim links directly back to the exact source chunk, quote, and document page.

### 🎨 3. Studio Artifact Generation
- Automatically synthesize multiple sources into structured formats:
  - 📖 **Study Guides & Executive Briefings**
  - ❓ **Comprehensive FAQs**
  - ⏱️ **Chronological Timelines**
  - 🔍 **Clause & Key Term Extractors**
  - 📝 **Executive Summaries**

### ✍️ 4. Intelligent Notes & AI Transformations
- Create, pin, and edit notes alongside your sources.
- Apply one-click AI transformations: **Summarize**, **Simplify**, **Translate**, **Formalize**, **Casualize**, or **Expand**.

### ⚡ 5. Background Jobs & Resilience
- Orchestrated with **Inngest** for resilient, fault-tolerant background vector indexing, chunk embedding, and long-running synthesis jobs.

---

## 🏗️ Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Next.js 16 (Client)     │
                          │   Vercel Edge / Serverless│
                          └─────────────┬─────────────┘
                                        │ (REST / SSE)
                                        ▼
                          ┌───────────────────────────┐
                          │   Express API (Server)    │
                          │   Render Web Service      │
                          └──────┬──────┬──────┬──────┘
                                 │      │      │
         ┌───────────────────────┘      │      └────────────────────────┐
         ▼                              ▼                               ▼
┌─────────────────┐           ┌──────────────────┐            ┌──────────────────┐
│ Neon PostgreSQL │           │  Inngest Cloud   │            │   OpenRouter     │
│   (pgvector)    │           │ (Background Jobs)│            │ (Gemma 4 & Embed)│
└─────────────────┘           └──────────────────┘            └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, TanStack Query, Lucide Icons |
| **Backend** | Node.js 22, Express.js 5, TypeScript, Multer, Inngest |
| **Authentication** | Clerk (JWT authentication across client & backend middleware) |
| **Database & ORM** | PostgreSQL with `pgvector` extension, Prisma ORM 7 |
| **AI & LLMs** | OpenRouter (`google/gemma-4-31b-it:free`, `nvidia/nemotron-3-embed-1b:free`) |
| **Media & Web Scraping**| Cloudinary (PDF Storage), Firecrawl (Web Scraping), YouTube Transcript API |
| **Deployment** | Vercel (Frontend), Render (Backend Container), Neon (Serverless Postgres) |

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js 22+
- Docker (optional, for local postgres with pgvector)
- Free accounts for: Clerk, OpenRouter, Cloudinary, Firecrawl (optional)

### 2. Clone the Repository
```bash
git clone https://github.com/VanshWAGH/ChaiBookLM.git
cd ChaiBookLM
```

### 3. Setup Server
```bash
cd server
npm install

# Configure environment variables
cp .env.example .env
# Edit server/.env with your DATABASE_URL, OPENROUTER_API_KEY, CLERK keys, etc.

# Run Prisma migrations
npx prisma migrate deploy

# Start server (runs on port 8081)
npm run dev
```

### 4. Setup Client
```bash
cd ../client
npm install

# Configure environment variables
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8081 and Clerk keys

# Start Next.js frontend (runs on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the platform!

---

## ☁️ Deployment

- **Frontend (Vercel):** Root directory `client`, set environment variables from `client/.env.local`.
- **Backend (Render):** Docker environment, root directory `server`, attach Neon Postgres URL with `pgvector` enabled.
- **Background Workflows (Inngest):** Connect your deployed backend endpoint `/api/inngest` to Inngest Cloud.

---

## 📄 License
This project is open-source under the [ISC License](LICENSE).
