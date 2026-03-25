import { Inject, Injectable } from '@nestjs/common'
import { MASTRA_MEMORY } from '../../common/constants/injection-tokens.js'

@Injectable()
export class MemoryService {
  constructor(@Inject(MASTRA_MEMORY) private readonly memory: any) {}

  getMemory() {
    return this.memory
  }
}
