import { Inject, Injectable, Logger } from '@nestjs/common'
import { MASTRA_MCP_CLIENT } from '../../common/constants/injection-tokens.js'

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name)

  constructor(@Inject(MASTRA_MCP_CLIENT) private readonly mcpClient: any) {}

  async getTools(): Promise<Record<string, any>> {
    this.logger.log('Fetching tools from MCP server')
    return this.mcpClient.listTools()
  }
}
