import { Inject, Injectable, Logger } from '@nestjs/common'
import { MASTRA_RAG_TOOL } from '../../common/constants/injection-tokens.js'

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name)

  constructor(@Inject(MASTRA_RAG_TOOL) private readonly ragTool: any) {}

  getQueryTool() {
    return this.ragTool
  }
}
