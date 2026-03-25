# Plan: Scaffolding MS Agentic (ventaagent-ms)

## Estrategia ESM/CJS

NestJS se mantiene en CJS. Mastra (ESM-only) se carga via `dynamic import()` en async providers. Patrón documentado y compatible con NestJS 11.

## Estructura de directorios

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── config.module.ts
│   ├── configuration.ts
│   └── env.validation.ts
├── common/
│   ├── constants/
│   │   └── injection-tokens.ts
│   ├── decorators/
│   │   └── public.decorator.ts
│   ├── dto/
│   │   └── api-response.dto.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── timeout.interceptor.ts
│   └── interfaces/
│       ├── agent-response.interface.ts
│       └── chat-context.interface.ts
├── health/
│   ├── health.module.ts
│   ├── health.controller.ts
│   └── health.service.ts
├── auth/
│   ├── auth.module.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── mastra/
│   ├── mastra.module.ts
│   ├── loader/
│   │   └── mastra-loader.module.ts
│   ├── agent/
│   │   ├── agent.module.ts
│   │   ├── agent.service.ts
│   │   └── agent.config.ts
│   ├── rag/
│   │   ├── rag.module.ts
│   │   ├── rag.service.ts
│   │   └── vector-store.service.ts
│   ├── memory/
│   │   ├── memory.module.ts
│   │   └── memory.service.ts
│   └── mcp/
│       ├── mcp.module.ts
│       ├── mcp-client.service.ts
│       ├── mcp-server.service.ts
│       └── tools/
│           ├── transacciones.tool.ts
│           └── index.ts
├── chat/
│   ├── chat.module.ts
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   └── dto/
│       ├── chat-request.dto.ts
│       └── chat-response.dto.ts
└── ingest/
    ├── ingest.module.ts
    ├── ingest.controller.ts
    ├── ingest.service.ts
    └── dto/
        ├── ingest-request.dto.ts
        └── ingest-response.dto.ts
```

Archivos raíz: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `.env.example`, `.gitignore`, `.dockerignore`, `.prettierrc`, `eslint.config.mjs`, `Dockerfile`, `vitest.config.ts`

## Módulos NestJS

```
AppModule
├── ConfigModule (global)
├── ThrottlerModule (global, rate limiting)
├── AuthModule (JWT strategy + global guard)
├── HealthModule (GET /agent/health, @Public)
├── MastraModule
│   ├── MastraLoaderModule (async providers via dynamic import())
│   ├── AgentModule (AgentService wraps Mastra Agent)
│   ├── RagModule (VectorStoreService + RagService)
│   ├── MemoryModule (MemoryService)
│   └── McpModule (McpClientService + McpServerService + tools)
├── ChatModule (POST /agent/chat)
└── IngestModule (POST /agent/ingest)
```

## Dependencias principales

- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` ^11.1
- `@nestjs/config`, `@nestjs/throttler`, `@nestjs/passport`
- `passport-jwt`
- `@mastra/core` ^1.10, `@mastra/memory`, `@mastra/rag`, `@mastra/mcp` ^1.3, `@mastra/mongodb`
- `@google-cloud/storage`
- `helmet`, `compression`, `class-validator`, `class-transformer`
- Dev: `typescript` ^5.7, `vitest`, `unplugin-swc`, `@swc/core`, `eslint`, `prettier`

## Patrón clave: MastraLoaderModule

Cada paquete Mastra se carga con `useFactory` async + `dynamic import()`:

```typescript
{
  provide: MASTRA_AGENT,
  useFactory: async (configService) => {
    const { Agent } = await import('@mastra/core/agent')
    return new Agent({ id: 'vra-agent', model: configService.get('AGENT_MODEL'), ... })
  },
  inject: [ConfigService],
}
```

## Secuencia de implementación

1. Config raíz (package.json, tsconfig, nest-cli, docker, etc.)
2. Bootstrap mínimo (main.ts, app.module.ts)
3. Config module (env validation)
4. Common (constants, decorators, filters, guards, interceptors)
5. Auth module (JWT strategy + guard)
6. Health module
7. Mastra loader module (ESM bridge)
8. MCP tools + server/client
9. RAG + Memory modules
10. Agent module + mastra.module.ts
11. Chat module (controller + service + DTOs)
12. Ingest module (controller + service + DTOs)
13. Dockerfile + test scaffolds

## Endpoints

| Método | Ruta           | Auth | Descripción                    |
|--------|----------------|------|--------------------------------|
| GET    | /agent/health  | No   | Health check para Cloud Run    |
| POST   | /agent/chat    | JWT  | Chat con VRA Agent             |
| POST   | /agent/ingest  | JWT  | Ingesta GCS → chunk → embed   |

## Decisiones clave

- **Vitest** sobre Jest (mejor soporte ESM, dirección NestJS v12)
- **Node16 module resolution** en tsconfig (soporta CJS + dynamic import ESM)
- **MCP Server in-process** (stdio transport, sin overhead de red)
- **Global prefix `agent`** para que todas las rutas estén bajo /agent/*
- **Cloud Run**: puerto 8080, Dockerfile multistage, health check
