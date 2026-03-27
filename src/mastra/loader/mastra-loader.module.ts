import { Global, Logger, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  MASTRA_VECTOR_STORE,
  MASTRA_MEMORY,
  MASTRA_RAG_TOOL,
  MASTRA_MCP_CLIENT,
  MASTRA_MCP_SERVER,
  MASTRA_AGENT,
} from '../../common/constants/injection-tokens.js'

const logger = new Logger('MastraLoaderModule')

@Global()
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
        const { MongoDBStore } = await import('@mastra/mongodb')

        const storage = new MongoDBStore({
          id: 'vra-memory-store',
          uri: configService.get<string>('mongodb.uri')!,
          dbName: configService.get<string>('mongodb.database')!,
        })

        return new Memory({
          storage,
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
        const { voyage } = await import('voyage-ai-provider')
        const embeddingModel = configService.get<string>('anthropic.embeddingModel', 'voyage-3-lite')!
        return createVectorQueryTool({
          vectorStore,
          indexName: configService.get<string>('vectorSearch.indexName')!,
          model: voyage.textEmbeddingModel(embeddingModel),
          description: 'Search VRA product documentation and knowledge base for relevant information',
        })
      },
      inject: [ConfigService, MASTRA_VECTOR_STORE],
    },
    {
      provide: MASTRA_MCP_SERVER,
      useFactory: async (configService: ConfigService) => {
        const { MCPServer } = await import('@mastra/mcp')
        const { createTool } = await import('@mastra/core/tools')
        const { MongoClient } = await import('mongodb')
        const { createServer } = await import('node:http')
        const { randomUUID } = await import('node:crypto')
        const { transaccionesToolDefinition, traspasoPorClienteToolDefinition } = await import('../mcp/tools/index.js')

        type TraspasoDoc = Record<string, unknown> & { _id: { toString(): string }; creado?: { toISOString?(): string } }

        const mongoClient = new MongoClient(configService.get<string>('mongodb.uri')!)
        await mongoClient.connect()
        const db = mongoClient.db(configService.get<string>('mongodb.database')!)
        const collection = db.collection<TraspasoDoc>('transacciones')

        const traspasosPorDia = createTool({
          ...transaccionesToolDefinition,
          execute: async (input) => {
            const { rutEjecutivo: rutEjecutivoRaw, fecha } = input as { rutEjecutivo: string; fecha: string }
            const rutEjecutivo = rutEjecutivoRaw.includes('-') ? rutEjecutivoRaw.split('-')[0] : rutEjecutivoRaw
            const fechaConsulta = fecha ? new Date(fecha) : new Date()
            const inicio = new Date(fechaConsulta)
            inicio.setUTCHours(0, 0, 0, 0)
            const fin = new Date(inicio)
            fin.setUTCDate(fin.getUTCDate() + 1)

            console.log(`Querying traspasos for ejecutivo ${rutEjecutivo} between ${inicio.toISOString()} and ${fin.toISOString()}`)

            const docs = await collection.find({
              'flujos.traspaso.notificarTraspaso.estado': 'ok',
              'ejecutivo.rut.numero': rutEjecutivo,
              creado: { $gte: inicio, $lt: fin },
            }, {
              projection: {
                'ejecutivo.nombre': 1, 'ejecutivo.apellidoPaterno': 1,
                'ejecutivo.rut': 1, 'ejecutivo.correo': 1,
                'flujos.traspaso.tipo': 1, 'flujos.traspaso.estado': 1,
                'flujos.traspaso.notificarTraspaso': 1, creado: 1,
              },
            }).toArray()
            return {
              traspasos: docs.map((d: any) => ({ ...d, _id: String(d._id), creado: d.creado?.toISOString?.() ?? String(d.creado) })),
              total: docs.length,
              fecha: inicio.toISOString().split('T')[0],
            }
          },
        })

        const traspasoPorCliente = createTool({
          ...traspasoPorClienteToolDefinition,
          execute: async (input) => {
            const { rutEjecutivo: rutEjecutivoRaw, rutCliente } = input as { rutEjecutivo: string; rutCliente: string }
            const rutEjecutivo = rutEjecutivoRaw.includes('-') ? rutEjecutivoRaw.split('-')[0] : rutEjecutivoRaw
            const rutNumero = rutCliente.includes('-') ? rutCliente.split('-')[0] : rutCliente
            const docs = await collection.find({
              'ejecutivo.rut.numero': rutEjecutivo,
              $or: [
                { 'flujos.traspaso.emails.envioTokenCliente.reqEnviarEmail.rut': { $regex: `^${rutNumero}` } },
                { 'flujos.traspaso.emails.enviarComprobante.reqEnviarEmail.rut': { $regex: `^${rutNumero}` } },
                { 'verificaciones.cliente.entradaProveedor.obtenerUrl.data.Run': { $regex: `^${rutNumero}` } },
              ],
            }, {
              projection: {
                ejecutivo: 1,
                'verificaciones.ejecutivo.estado': 1, 'verificaciones.ejecutivo.verificacion': 1,
                'verificaciones.cliente.estado': 1, 'verificaciones.cliente.verificacion': 1,
                'verificaciones.cliente.codigoVerificacion': 1,
                'flujos.traspaso.tipo': 1, 'flujos.traspaso.estado': 1,
                'flujos.traspaso.notificarTraspaso': 1, creado: 1,
              },
            }).toArray()
            return {
              traspasos: docs.map((d: any) => ({ ...d, _id: String(d._id), creado: d.creado?.toISOString?.() ?? String(d.creado) })),
              total: docs.length,
            }
          },
        })

        const mcpServer = new MCPServer({
          name: 'vra20',
          version: '1.0.0',
          tools: {
            [traspasosPorDia.id]: traspasosPorDia,
            [traspasoPorCliente.id]: traspasoPorCliente,
          },
        })

        const port = configService.get<number>('mcp.serverPort', 3001)
        const httpServer = createServer((req, res) => {
          mcpServer.startHTTP({
            url: new URL(req.url ?? '/', `http://localhost:${port}`),
            httpPath: '/mcp',
            req,
            res,
            options: { sessionIdGenerator: () => randomUUID() },
          }).catch((err: unknown) => {
            logger.error(`MCP request error: ${err instanceof Error ? err.message : String(err)}`)
          })
        })

        await new Promise<void>((resolve) => httpServer.listen(port, resolve))
        logger.log(`MCP Server running on port ${port}`)

        return { mcpServer, httpServer, mongoClient }
      },
      inject: [ConfigService],
    },
    {
      provide: MASTRA_MCP_CLIENT,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      useFactory: async (configService: ConfigService, _server: unknown) => {
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
      inject: [ConfigService, MASTRA_MCP_SERVER],
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

        let mcpTools: Record<string, unknown> = {}
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          mcpTools = await mcpClient.listTools() as Record<string, unknown>
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          logger.warn(`MCP server unavailable, starting without MCP tools: ${message}`)
        }

        return new Agent({
          id: 'vra-agent',
          name: 'VRA Agent',
          instructions:   `Eres un asistente especializado en la aplicación Venta Remota Asistida  (VRA).
                          Tu rol es ayudar a los ejecutivos con información sobre como usar la aplicación
                          de traspasos AFP Capital, incluyendo detalles de funcionalidad
                          procedimientos de traspaso, y consultas sobre transacciones y verificaciones de identidad del cliente.

                          Utiliza las herramientas disponibles para:
                          1. Buscar documentación relevante del producto (RAG)
                          2. Consultar transacciones en la base de datos (MCP)

                          Responde siempre en español. Sé preciso y conciso, con una actitud amigable.`,
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
