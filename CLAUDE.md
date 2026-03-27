# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS microservice gateway for an AI-powered annual sales agent (VRA - Venta de Rentas Anuales). Combines NestJS HTTP gateway with Mastra AI engine using Claude Sonnet, MongoDB Atlas vector search, and Model Context Protocol (MCP) for database access. Deployed on Google Cloud Run.

## Commands

```bash
# Development
npm run start:dev       # Hot-reload dev server
npm run start:debug     # Debug mode with breakpoints

# Build & Production
npm run build           # Compile TypeScript → dist/
npm run start:prod      # Run compiled output (node dist/main)

# Testing
npm test                # Vitest unit tests (src/**/*.spec.ts)
npm run test:watch      # Watch mode
npm run test:cov        # With coverage report
npm run test:e2e        # E2E tests (test/**/*.e2e-spec.ts)

# Code Quality
npm run lint            # ESLint on {src,test}/**/*.ts
npm run format          # Prettier on {src,test}/**/*.ts
```

## Architecture

### Request Flow
```
Client → JwtAuthGuard + ThrottlerGuard → Controller → ChatService → MastraAgentService → Claude Sonnet
                                                                         ↓
                                                              RAG Tool (MongoDB vector search)
                                                              MCP Tools (transaction DB queries)
                                                              Memory (MongoDB conversation history)
```

### Module Structure

- **`auth/`** — JWT authentication (Passport strategy). Login endpoint with placeholder user validation (TODO: real DB).
- **`chat/`** — Routes messages to Mastra agent; supports streaming (SSE) and non-streaming responses.
- **`ingest/`** — Document ingestion pipeline: GCS/file upload → extract text → chunk → embed (Voyage AI) → upsert to MongoDB Atlas vector index.
- **`health/`** — Cloud Run health check endpoint (`/agent/health`, public).
- **`config/`** — Centralizes all env vars into a typed config object (`configuration.ts`).
- **`mastra/`** — AI engine integration, lazy-loaded via `MastraLoaderModule`:
  - `agent/` — Wraps Mastra Agent with Claude Sonnet; generate and stream methods.
  - `rag/` — Vector query tool over MongoDB Atlas; `vector-store.service.ts` manages index operations.
  - `memory/` — Conversation history in MongoDB (20-message window).
  - `mcp/` — Model Context Protocol client/server bridge; tools in `mcp/tools/`.
- **`common/`** — Shared injection tokens, decorators, filters, interceptors, interfaces.

### Global Infrastructure (set up in `app.module.ts` + `main.ts`)

- **Guards:** `JwtAuthGuard` (global, with `@Public()` exemption decorator) + `ThrottlerGuard` (20 req/60s).
- **Interceptors:** `LoggingInterceptor` (request duration), `TimeoutInterceptor`.
- **Filter:** `AllExceptionsFilter` — centralized error response shape.
- **Middleware:** helmet, compression, CORS.

### Dependency Injection Tokens (`common/constants/injection-tokens.ts`)

Mastra services are provided as singletons via factory providers in `MastraLoaderModule` and injected using these tokens:
`MASTRA_INSTANCE`, `MASTRA_AGENT`, `MASTRA_MEMORY`, `MASTRA_VECTOR_STORE`, `MASTRA_RAG_TOOL`, `MASTRA_MCP_CLIENT`, `MASTRA_MCP_SERVER`

## Key Conventions

- **`@Public()`** decorator marks routes that bypass `JwtAuthGuard` (e.g., `/agent/health`, `/agent/login`).
- **Language:** Agent instructions and domain terms are in Spanish (VRA, transacciones, ejecutivos).
- **Code style:** No semicolons, single quotes, 100-char line width, trailing commas (see `.prettierrc`).
- **TypeScript:** Strict mode; `no-explicit-any` is disabled by ESLint, but `no-floating-promises` and `no-unsafe-argument` are warnings.
- **Testing:** Vitest with SWC transpiler; globals (`describe`, `it`, `expect`) are available without imports.

## Environment Variables

Required: `JWT_SECRET`, `MONGODB_URI`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`
Optional: `GCS_BUCKET_NAME`, `GCS_PROJECT_ID`, `MCP_SERVER_PORT` (default: 3001), `THROTTLE_TTL` (default: 60000ms), `THROTTLE_LIMIT` (default: 20)

JWT tokens use issuer `vra-bff` and audience `ventaagent-ms`.

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/agent/health` | No | Health check |
| POST | `/agent/login` | No | Get JWT token |
| POST | `/agent/chat` | JWT | Chat with agent |
| POST | `/agent/chat/stream` | JWT | Streaming SSE chat |
| POST | `/agent/ingest` | JWT | Ingest from GCS |
| POST | `/agent/ingest/upload` | JWT | Ingest uploaded file (PDF/TXT/MD) |
