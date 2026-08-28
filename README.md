# NotebookLM Clone

AI research notebook with source ingestion, RAG chat, and Studio artifacts — powered by **OpenRouter Gemma 4** (chat) and **Nemotron Embed** (retrieval).

## Stack

- **Frontend**: Next.js 16, shadcn/ui, React Query, Better Auth client
- **Backend**: Express, Prisma, PostgreSQL, Inngest, Better Auth
- **AI**: OpenRouter (`google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-3-embed-1b:free`)

## Setup

### 1. Database

Start PostgreSQL (port 5434 in `.env`) and run migrations:

```bash
cd server
npx prisma migrate deploy
```

### 2. Environment

Copy example env files and fill in values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Required:
- `OPENROUTER_API_KEY` — for chat and embeddings
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — random secret string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for Google sign-in (optional)

### 3. Install & run

```bash
cd server && npm install
cd ../client && npm install

# Terminal 1 — API (port 8081)
cd server && npm run dev

# Terminal 2 — UI (port 3000)
cd client && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

| Feature | Status |
|---------|--------|
| Google OAuth sign-in | Ready |
| Notebook (workspace) CRUD | Ready |
| Sources: PDF, URL, YouTube, text | Ready |
| Source processing + embeddings | Ready (Inngest or direct fallback) |
| RAG chat with citations (SSE stream) | Ready |
| Studio: Study Guide, FAQ, Briefing, Timeline | Ready |

## API Routes

- `GET/POST /api/workspaces` — notebooks
- `GET/POST /api/workspaces/:id/sources` — sources
- `GET/POST /api/workspaces/:id/conversations` — chat
- `POST /api/workspaces/:id/conversations/:id/messages` — stream chat (SSE)
- `POST /api/workspaces/:id/artifacts/study-guide` — generate artifacts
