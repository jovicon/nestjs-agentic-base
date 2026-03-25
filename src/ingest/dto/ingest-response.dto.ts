export class IngestResponseDto {
  chunksProcessed: number
  status: 'completed' | 'failed'
  fileName: string
  timestamp: string
}
