import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { VectorStoreService } from '../mastra/rag/vector-store.service.js'
import { IngestRequestDto } from './dto/ingest-request.dto.js'
import { IngestResponseDto } from './dto/ingest-response.dto.js'

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async ingestDocument(dto: IngestRequestDto): Promise<IngestResponseDto> {
    this.logger.log(`Starting ingestion: ${dto.bucketName}/${dto.fileName}`)

    try {
      // Step 1: Read from GCS
      const content = await this.readFromGcs(dto.bucketName, dto.fileName)

      // Step 2: Chunk the document
      const chunks = await this.chunkDocument(content, {
        strategy: dto.chunkStrategy ?? 'recursive',
        size: dto.chunkSize ?? 512,
        overlap: dto.chunkOverlap ?? 50,
      })

      // Step 3: Generate embeddings
      const embeddings = await this.generateEmbeddings(chunks)

      // Step 4: Upsert to vector store
      await this.upsertVectors(embeddings, dto.fileName)

      this.logger.log(`Ingestion completed: ${chunks.length} chunks processed`)

      return {
        chunksProcessed: chunks.length,
        status: 'completed',
        fileName: dto.fileName,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`Ingestion failed for ${dto.fileName}`, error)
      return {
        chunksProcessed: 0,
        status: 'failed',
        fileName: dto.fileName,
        timestamp: new Date().toISOString(),
      }
    }
  }

  private async readFromGcs(bucketName: string, fileName: string): Promise<string> {
    this.logger.log(`Reading from GCS: ${bucketName}/${fileName}`)
    // TODO: Implement GCS read using @google-cloud/storage
    // const { Storage } = await import('@google-cloud/storage')
    // const storage = new Storage({ projectId: this.configService.get('gcs.projectId') })
    // const [content] = await storage.bucket(bucketName).file(fileName).download()
    // return content.toString('utf-8')
    throw new Error('GCS read not yet implemented')
  }

  private async chunkDocument(
    content: string,
    options: { strategy: string; size: number; overlap: number },
  ): Promise<string[]> {
    this.logger.log(`Chunking document with strategy: ${options.strategy}`)
    // TODO: Implement chunking using @mastra/rag
    // const { MDocument } = await import('@mastra/rag')
    // const doc = MDocument.fromText(content)
    // const chunks = await doc.chunk({ strategy: options.strategy, size: options.size, overlap: options.overlap })
    // return chunks.map(c => c.text)
    throw new Error('Document chunking not yet implemented')
  }

  private async generateEmbeddings(chunks: string[]): Promise<Array<{ text: string; values: number[] }>> {
    this.logger.log(`Generating embeddings for ${chunks.length} chunks`)
    // TODO: Implement embedding using AI SDK + embedding model
    // const { embedMany } = await import('ai')
    // const result = await embedMany({ model: this.configService.get('anthropic.embeddingModel'), values: chunks })
    // return chunks.map((text, i) => ({ text, values: result.embeddings[i] }))
    throw new Error('Embedding generation not yet implemented')
  }

  private async upsertVectors(
    embeddings: Array<{ text: string; values: number[] }>,
    fileName: string,
  ): Promise<void> {
    this.logger.log(`Upserting ${embeddings.length} vectors`)
    const vectors = embeddings.map((e, i) => ({
      id: `${fileName}-chunk-${i}`,
      values: e.values,
      metadata: { text: e.text, source: fileName, chunkIndex: i },
    }))
    await this.vectorStoreService.upsert(vectors)
  }
}
