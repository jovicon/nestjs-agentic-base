import { Module } from '@nestjs/common'
import { McpClientService } from './mcp-client.service.js'
import { McpServerService } from './mcp-server.service.js'

@Module({
  providers: [McpClientService, McpServerService],
  exports: [McpClientService, McpServerService],
})
export class McpModule {}
