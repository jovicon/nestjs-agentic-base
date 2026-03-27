import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  transaccionesToolDefinition,
  traspasoPorClienteToolDefinition,
} from './tools/index.js'

@Injectable()
export class McpServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpServerService.name)
  private server: any
  private mongoClient: any

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing MCP Server...')

    const { MongoClient } = await import('mongodb')
    const { createTool } = await import('@mastra/core/tools')

    const uri = this.configService.get<string>('mongodb.uri')!
    this.mongoClient = new MongoClient(uri)
    await this.mongoClient.connect()

    const db = this.mongoClient.db(this.configService.get<string>('mongodb.database')!)
    const collection = db.collection('traspasos')

    const traspasosPorDia = createTool({
      ...transaccionesToolDefinition,
      execute: async (input) => {
        const { rutEjecutivo, fecha } = input as { rutEjecutivo: string; fecha: string }

        const fechaConsulta = fecha ? new Date(fecha) : new Date()
        const inicio = new Date(fechaConsulta)
        inicio.setUTCHours(0, 0, 0, 0)
        const fin = new Date(inicio)
        fin.setUTCDate(fin.getUTCDate() + 1)

        const query = {
          'flujos.traspaso.notificarTraspaso.estado': 'ok',
          'ejecutivo.rut.numero': rutEjecutivo,
          creado: { $gte: inicio, $lt: fin },
        }

        const docs = await collection
          .find(query, {
            projection: {
              'ejecutivo.nombre': 1,
              'ejecutivo.apellidoPaterno': 1,
              'ejecutivo.rut': 1,
              'ejecutivo.correo': 1,
              'flujos.traspaso.tipo': 1,
              'flujos.traspaso.estado': 1,
              'flujos.traspaso.notificarTraspaso': 1,
              creado: 1,
            },
          })
          .toArray()

        return {
          traspasos: docs.map((d: any) => ({
            ...d,
            _id: String(d._id),
            creado: d.creado?.toISOString?.() ?? String(d.creado),
          })),
          total: docs.length,
          fecha: inicio.toISOString().split('T')[0],
        }
      },
    })

    const traspasoPorCliente = createTool({
      ...traspasoPorClienteToolDefinition,
      execute: async (input) => {
        const { rutEjecutivo, rutCliente } = input as { rutEjecutivo: string; rutCliente: string }

        // Normalizar RUT: aceptar "13256451-5" o "13256451"
        const rutNumero = rutCliente.includes('-') ? rutCliente.split('-')[0] : rutCliente

        const query = {
          'ejecutivo.rut.numero': rutEjecutivo,
          $or: [
            { 'flujos.traspaso.emails.envioTokenCliente.reqEnviarEmail.rut': { $regex: `^${rutNumero}` } },
            { 'flujos.traspaso.emails.enviarComprobante.reqEnviarEmail.rut': { $regex: `^${rutNumero}` } },
            { 'verificaciones.cliente.entradaProveedor.obtenerUrl.data.Run': { $regex: `^${rutNumero}` } },
          ],
        }

        const docs = await collection
          .find(query, {
            projection: {
              ejecutivo: 1,
              'verificaciones.ejecutivo.estado': 1,
              'verificaciones.ejecutivo.verificacion': 1,
              'verificaciones.cliente.estado': 1,
              'verificaciones.cliente.verificacion': 1,
              'verificaciones.cliente.codigoVerificacion': 1,
              'flujos.traspaso.tipo': 1,
              'flujos.traspaso.estado': 1,
              'flujos.traspaso.notificarTraspaso': 1,
              creado: 1,
            },
          })
          .toArray()

        return {
          traspasos: docs.map((d: any) => ({
            ...d,
            _id: String(d._id),
            creado: d.creado?.toISOString?.() ?? String(d.creado),
          })),
          total: docs.length,
        }
      },
    })

    const port = this.configService.get<number>('mcp.serverPort', 3001)

    const { MCPServer } = await import('@mastra/mcp')
    const { createServer } = await import('node:http')
    const { randomUUID } = await import('node:crypto')

    const mcpServer = new MCPServer({
      name: 'vra20',
      version: '1.0.0',
      tools: {
        [traspasosPorDia.id]: traspasosPorDia,
        [traspasoPorCliente.id]: traspasoPorCliente,
      },
    })

    const httpServer = createServer(async (req, res) => {
      await mcpServer.startHTTP({
        url: new URL(req.url ?? '/', `http://localhost:${port}`),
        httpPath: '/mcp',
        req,
        res,
        options: { sessionIdGenerator: () => randomUUID() },
      })
    })

    await new Promise<void>((resolve) => httpServer.listen(port, resolve))
    this.server = { mcpServer, httpServer }
    this.logger.log(`MCP Server running on port ${port}`)
  }

  async onModuleDestroy() {
    if (this.server) {
      this.logger.log('Shutting down MCP Server...')
      await this.server.mcpServer.close()
      await new Promise<void>((resolve) => this.server.httpServer.close(() => resolve()))
    }
    if (this.mongoClient) {
      await this.mongoClient.close()
    }
  }
}
