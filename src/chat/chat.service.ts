import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AgentService } from '../mastra/agent/agent.service.js'
import { ChatRequestDto } from './dto/chat-request.dto.js'
import { ChatResponseDto } from './dto/chat-response.dto.js'

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  constructor(private readonly agentService: AgentService) {}

  async processMessage(dto: ChatRequestDto, userId: string): Promise<ChatResponseDto> {
    const threadId = dto.threadId ?? randomUUID()
    const resourceId = dto.resourceId ?? userId

    this.logger.log(`Processing chat message for user: ${userId}, thread: ${threadId}`)

    const result = await this.agentService.generate(dto.message, {
      threadId,
      resourceId,
    })

    return {
      response: result.text,
      threadId,
      sources: result.sources,
      timestamp: new Date().toISOString(),
    }
  }
}
