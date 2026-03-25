import { z } from 'zod'

export const transaccionesToolDefinition = {
  id: 'query-transacciones',
  description: 'Consulta transacciones en la base de datos VRA20. Permite buscar por RUT, fecha, estado y tipo de traspaso.',
  inputSchema: z.object({
    rut: z.string().optional().describe('RUT del cliente'),
    fechaInicio: z.string().optional().describe('Fecha inicio en formato YYYY-MM-DD'),
    fechaFin: z.string().optional().describe('Fecha fin en formato YYYY-MM-DD'),
    estado: z.enum(['ok', 'error', 'pendiente']).optional().describe('Estado del traspaso'),
    tipoTraspaso: z.enum(['total', 'parcial']).optional().describe('Tipo de traspaso'),
    limit: z.number().optional().default(10).describe('Límite de resultados'),
  }),
  outputSchema: z.object({
    transacciones: z.array(z.record(z.any())),
    total: z.number(),
  }),
}

export const verificacionesToolDefinition = {
  id: 'query-verificaciones',
  description: 'Consulta el estado de verificaciones de identidad por método (preguntas, firma, facial).',
  inputSchema: z.object({
    rut: z.string().optional().describe('RUT del cliente'),
    fechaInicio: z.string().optional().describe('Fecha inicio en formato YYYY-MM-DD'),
    fechaFin: z.string().optional().describe('Fecha fin en formato YYYY-MM-DD'),
    metodo: z.enum(['VI03', 'VI08', 'VI12']).optional().describe('Método de verificación: VI03=Preguntas, VI08=Firma, VI12=Facial'),
  }),
  outputSchema: z.object({
    verificaciones: z.array(z.record(z.any())),
    total: z.number(),
  }),
}
