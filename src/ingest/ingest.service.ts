import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { VectorStoreService } from '../mastra/rag/vector-store.service.js'
import { IngestRequestDto } from './dto/ingest-request.dto.js'
import { UploadRequestDto } from './dto/upload-request.dto.js'
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

  async ingestUploadedFile(
    file: Express.Multer.File,
    options: UploadRequestDto,
  ): Promise<IngestResponseDto> {
    this.logger.log(`Starting upload ingestion: ${file.originalname} (${file.size} bytes)`)

    try {
      // Extract text content from file buffer
      const content = await this.extractTextFromFile(file)

      // Reuse the same pipeline: chunk → embed → upsert
      const chunks = await this.chunkDocument(content, {
        strategy: options.chunkStrategy ?? 'recursive',
        size: options.chunkSize ?? 512,
        overlap: options.chunkOverlap ?? 50,
      })

      const embeddings = await this.generateEmbeddings(chunks)
      await this.upsertVectors(embeddings, file.originalname)

      this.logger.log(`Upload ingestion completed: ${chunks.length} chunks processed`)

      return {
        chunksProcessed: chunks.length,
        status: 'completed',
        fileName: file.originalname,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`Upload ingestion failed for ${file.originalname}`, error)
      return {
        chunksProcessed: 0,
        status: 'failed',
        fileName: file.originalname,
        timestamp: new Date().toISOString(),
      }
    }
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) })
      const result = await parser.getText()
      await parser.destroy()
      return result.text
    }
    // TXT and MD files: read buffer as UTF-8
    return file.buffer.toString('utf-8')
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
    const { MDocument } = await import('@mastra/rag')

    const doc = MDocument.fromText(content)

    const chunkParams: any = {
      strategy: options.strategy,
      maxSize: options.size,
      overlap: options.overlap,
    }

    // sentence strategy requires maxSize as a named param
    if (options.strategy === 'sentence') {
      chunkParams.maxSize = options.size
    }

    const chunks = await doc.chunk(chunkParams)
    const texts = chunks.map((c) => c.text)

    this.logger.log(`Chunked into ${texts.length} pieces`)
    return texts
  }

  private async generateEmbeddings(chunks: string[]): Promise<Array<{ text: string; values: number[] }>> {
    this.logger.log(`Generating embeddings for ${chunks.length} chunks with Voyage AI`)

    const { embedMany } = await import('ai')
    const { voyage } = await import('voyage-ai-provider')

    const model = this.configService.get<string>('anthropic.embeddingModel', 'voyage-3-lite')

    const { embeddings } = await embedMany({
      model: voyage.textEmbeddingModel(model),
      values: chunks,
    })

    return chunks.map((text, i) => ({ text, values: embeddings[i] }))
  }

  private async upsertVectors(
    embeddings: Array<{ text: string; values: number[] }>,
    fileName: string,
  ): Promise<void> {
    this.logger.log(`Upserting ${embeddings.length} vectors`)
    await this.vectorStoreService.upsert({
      vectors: embeddings.map((e) => e.values),
      metadata: embeddings.map((e, i) => ({ text: e.text, source: fileName, chunkIndex: i })),
      ids: embeddings.map((_, i) => `${fileName}-chunk-${i}`),
    })
  }
}
