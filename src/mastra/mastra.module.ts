import { Module } from '@nestjs/common'
import { MastraLoaderModule } from './loader/mastra-loader.module.js'
import { AgentModule } from './agent/agent.module.js'
import { RagModule } from './rag/rag.module.js'
import { MemoryModule } from './memory/memory.module.js'
import { McpModule } from './mcp/mcp.module.js'

@Module({
  imports: [MastraLoaderModule, AgentModule, RagModule, MemoryModule, McpModule],
  exports: [MastraLoaderModule, AgentModule, RagModule, MemoryModule, McpModule],
})
export class MastraModule {}
