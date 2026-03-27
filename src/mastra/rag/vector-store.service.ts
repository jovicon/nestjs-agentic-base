import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MASTRA_VECTOR_STORE } from '../../common/constants/injection-tokens.js'

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name)

  constructor(
    @Inject(MASTRA_VECTOR_STORE) private readonly vectorStore: any,
    private readonly configService: ConfigService,
  ) {}

  async upsert(params: {
    indexName?: string
    vectors: number[][]
    metadata?: Record<string, any>[]
    ids?: string[]
  }) {
    const indexName = params.indexName ?? this.configService.get<string>('vectorSearch.indexName', 'vector_index')
    const dimension = params.vectors[0]?.length ?? this.configService.get<number>('vectorSearch.embeddingDimension', 1024)

    await this.ensureIndex(indexName, dimension)

    this.logger.log(`Upserting ${params.vectors.length} vectors to index: ${indexName}`)
    return this.vectorStore.upsert({
      indexName,
      vectors: params.vectors,
      metadata: params.metadata,
      ids: params.ids,
    })
  }

  private async ensureIndex(indexName: string, dimension: number) {
    try {
      const indexes: string[] = await this.vectorStore.listIndexes()
      if (!indexes.includes(indexName)) {
        this.logger.log(`Index "${indexName}" not found, creating with dimension ${dimension}...`)
        await this.vectorStore.createIndex({ indexName, dimension, metric: 'cosine' })
      }
    } catch (error) {
      this.logger.warn(`Could not verify index "${indexName}", attempting upsert anyway: ${error}`)
    }
  }

  async query(embedding: number[], topK = 5) {
    const indexName = this.configService.get<string>('vectorSearch.indexName', 'vector_index')
    return this.vectorStore.query({ indexName, queryVector: embedding, topK })
  }

  async createIndex(indexName: string, dimension: number) {
    this.logger.log(`Creating index: ${indexName} with dimension: ${dimension}`)
    return this.vectorStore.createIndex({ indexName, dimension })
  }
}
