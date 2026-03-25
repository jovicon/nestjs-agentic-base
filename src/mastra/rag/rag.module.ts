import { Module } from '@nestjs/common'
import { RagService } from './rag.service.js'
import { VectorStoreService } from './vector-store.service.js'

@Module({
  providers: [RagService, VectorStoreService],
  exports: [RagService, VectorStoreService],
})
export class RagModule {}
