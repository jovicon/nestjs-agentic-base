# ventaagent-ms (MS Agentic)

Microservicio agentico para Venta de Rentas Anuales. NestJS Gateway + Mastra Engine desplegado en Cloud Run (GCP).

## Stack

- **NestJS 11** - Gateway HTTP (Auth JWT, Rate Limiting, REST)
- **Mastra** - Motor de agentes IA (Agent, RAG, Memory, MCP)
- **Claude Sonnet** - LLM via Anthropic
- **MongoDB Atlas** - Vector Search + almacenamiento
- **Google Cloud Storage** - PDFs fuente para ingesta

## Endpoints

| Metodo | Ruta            | Auth | Descripcion                  |
|--------|-----------------|------|------------------------------|
| GET    | /agent/health   | No   | Health check (Cloud Run)     |
| POST   | /agent/chat     | JWT  | Chat con VRA Agent           |
| POST   | /agent/ingest   | JWT  | Ingesta GCS -> chunk -> embed|

## Setup

```bash
cp .env.example .env
# Editar .env con valores reales
npm install
npm run start:dev
```

## Build & Deploy

```bash
npm run build
docker build -t ventaagent-ms .
docker run -p 8080:8080 --env-file .env ventaagent-ms
```

## Arquitectura

```
NestJS Gateway (JWT + Rate Limit)
  -> Mastra Engine
       -> VRA Agent (instrucciones + memoria)
       -> RAG Tool (embed + vector search MongoDB Atlas)
       -> MCP Client (-> MCP Server -> MongoDB VRA20 read-only)
       -> LLM (Claude Sonnet)
  -> Ingestion Pipeline (GCS -> chunk -> embed -> upsert Atlas)
```
