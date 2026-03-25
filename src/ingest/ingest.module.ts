import { Module } from '@nestjs/common'
import { IngestController } from './ingest.controller.js'
import { IngestService } from './ingest.service.js'
import { MastraModule } from '../mastra/mastra.module.js'

@Module({
  imports: [MastraModule],
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule {}
