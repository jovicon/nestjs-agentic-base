import { z } from 'zod'

export const transaccionesToolDefinition = {
  id: 'query-traspasos-por-dia',
  description:
    'Consulta los traspasos completados (estado ok) de un ejecutivo en un día específico. Usa el RUT del ejecutivo del JWT de sesión.',
  inputSchema: z.object({
    rutEjecutivo: z.string().describe('RUT del ejecutivo (solo número, sin DV). Ej: 25800433'),
    fecha: z
      .string()
      .describe('Fecha a consultar en formato YYYY-MM-DD. Si no se indica, usa hoy.'),
  }),
  outputSchema: z.object({
    traspasos: z.array(
      z.object({
        _id: z.string(),
        ejecutivo: z.object({
          nombre: z.string(),
          apellidoPaterno: z.string(),
          rut: z.object({ numero: z.string(), dv: z.string() }),
          correo: z.string().optional(),
        }),
        cliente: z
          .object({
            nombre: z.string().optional(),
            rut: z.string().optional(),
          })
          .optional(),
        flujos: z.object({
          traspaso: z.object({
            tipo: z.string().optional(),
            estado: z.number(),
            notificarTraspaso: z
              .object({
                estado: z.string().optional(),
                folio: z.string().optional(),
                regimenAnterior: z.string().optional(),
                regimenNuevo: z.string().optional(),
              })
              .optional(),
          }),
        }),
        creado: z.string(),
      }),
    ),
    total: z.number(),
    fecha: z.string(),
  }),
}

export const traspasoPorClienteToolDefinition = {
  id: 'query-traspaso-por-cliente',
  description:
    'Busca el traspaso de un ejecutivo para un cliente específico por RUT del cliente.',
  inputSchema: z.object({
    rutEjecutivo: z.string().describe('RUT del ejecutivo (solo número, sin DV). Ej: 25800433'),
    rutCliente: z
      .string()
      .describe('RUT del cliente en formato numero-dv o solo número. Ej: 13256451-5 o 13256451'),
  }),
  outputSchema: z.object({
    traspasos: z.array(
      z.object({
        _id: z.string(),
        ejecutivo: z.object({
          nombre: z.string(),
          apellidoPaterno: z.string(),
          rut: z.object({ numero: z.string(), dv: z.string() }),
        }),
        verificaciones: z
          .object({
            ejecutivo: z.array(z.record(z.any())).optional(),
            cliente: z.array(z.record(z.any())).optional(),
          })
          .optional(),
        flujos: z.object({
          traspaso: z.object({
            tipo: z.string().optional(),
            estado: z.number(),
            notificarTraspaso: z
              .object({
                estado: z.string().optional(),
                folio: z.string().optional(),
                regimenAnterior: z.string().optional(),
                regimenNuevo: z.string().optional(),
              })
              .optional(),
          }),
        }),
        creado: z.string(),
      }),
    ),
    total: z.number(),
  }),
}
