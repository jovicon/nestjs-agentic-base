import { Inject, Injectable, Logger } from '@nestjs/common'
import { MASTRA_VECTOR_STORE } from '../../common/constants/injection-tokens.js'

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name)

  constructor(@Inject(MASTRA_VECTOR_STORE) private readonly vectorStore: any) {}

  async upsert(vectors: Array<{ id: string; values: number[]; metadata: Record<string, any> }>) {
    this.logger.log(`Upserting ${vectors.length} vectors`)
    return this.vectorStore.upsert(vectors)
  }

  async query(embedding: number[], topK = 5) {
    return this.vectorStore.query({ vector: embedding, topK })
  }

  async createIndex(indexName: string, dimension: number) {
    this.logger.log(`Creating index: ${indexName} with dimension: ${dimension}`)
    return this.vectorStore.createIndex({ indexName, dimension })
  }
}
