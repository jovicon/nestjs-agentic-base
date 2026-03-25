import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  MASTRA_VECTOR_STORE,
  MASTRA_MEMORY,
  MASTRA_RAG_TOOL,
  MASTRA_MCP_CLIENT,
  MASTRA_AGENT,
} from '../../common/constants/injection-tokens.js'

@Module({
  providers: [
    {
      provide: MASTRA_VECTOR_STORE,
      useFactory: async (configService: ConfigService) => {
        const { MongoDBVector } = await import('@mastra/mongodb')
        return new MongoDBVector({
          id: 'vra-vectors',
          uri: configService.get<string>('mongodb.uri')!,
          dbName: configService.get<string>('mongodb.vectorDatabase')!,

        })
      },
      inject: [ConfigService],
    },
    {
      provide: MASTRA_MEMORY,
      useFactory: async (configService: ConfigService) => {
        const { Memory } = await import('@mastra/memory')
        return new Memory({
          options: {
            lastMessages: 20,
            semanticRecall: false,
          },
        })
      },
      inject: [ConfigService],
    },
    {
      provide: MASTRA_RAG_TOOL,
      useFactory: async (configService: ConfigService, vectorStore: any) => {
        const { createVectorQueryTool } = await import('@mastra/rag')
        return createVectorQueryTool({
          vectorStoreName: 'mongodb-atlas',
          indexName: configService.get<string>('vectorSearch.indexName')!,
          model: configService.get<string>('anthropic.embeddingModel')!,
          description: 'Search VRA product documentation and knowledge base for relevant information',
        })
      },
      inject: [ConfigService, MASTRA_VECTOR_STORE],
    },
    {
      provide: MASTRA_MCP_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const { MCPClient } = await import('@mastra/mcp')
        const client = new MCPClient({
          servers: {
            vra20: {
              url: new URL(
                `http://localhost:${configService.get<number>('mcp.serverPort')}/mcp`,
              ),
            },
          },
        })
        return client
      },
      inject: [ConfigService],
    },
    {
      provide: MASTRA_AGENT,
      useFactory: async (
        configService: ConfigService,
        memory: any,
        ragTool: any,
        mcpClient: any,
      ) => {
        const { Agent } = await import('@mastra/core/agent')
        const mcpTools = await mcpClient.listTools()

        return new Agent({
          id: 'vra-agent',
          name: 'VRA Agent',
          instructions: `Eres un asistente especializado en Venta de Rentas Anuales (VRA).
Tu rol es ayudar a los ejecutivos con información sobre productos de rentas anuales,
procedimientos de traspaso, y consultas sobre transacciones.

Utiliza las herramientas disponibles para:
1. Buscar documentación relevante del producto (RAG)
2. Consultar transacciones en la base de datos (MCP)

Responde siempre en español. Sé preciso y conciso.`,
          model: configService.get<string>('anthropic.agentModel')!,
          tools: {
            vectorQuery: ragTool,
            ...mcpTools,
          },
          memory,
        })
      },
      inject: [ConfigService, MASTRA_MEMORY, MASTRA_RAG_TOOL, MASTRA_MCP_CLIENT],
    },
  ],
  exports: [
    MASTRA_VECTOR_STORE,
    MASTRA_MEMORY,
    MASTRA_RAG_TOOL,
    MASTRA_MCP_CLIENT,
    MASTRA_AGENT,
  ],
})
export class MastraLoaderModule {}
