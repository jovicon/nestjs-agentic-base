import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { Response } from 'express'
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

  async streamMessage(dto: ChatRequestDto, userId: string, res: Response): Promise<void> {
    const threadId = dto.threadId ?? randomUUID()
    const resourceId = dto.resourceId ?? userId

    this.logger.log(`Streaming response for user: ${userId}, thread: ${threadId}`)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Send threadId as first event
    res.write(`event: metadata\ndata: ${JSON.stringify({ threadId })}\n\n`)
    res.flush?.()

    const output = await this.agentService.stream(dto.message, {
      threadId,
      resourceId,
    })

    const reader = output.textStream.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(`event: text\ndata: ${JSON.stringify(value)}\n\n`)
        res.flush?.()
      }

      const sources = await output.sources
      res.write(`event: sources\ndata: ${JSON.stringify(sources ?? [])}\n\n`)
      res.write(`event: done\ndata: [DONE]\n\n`)
      res.flush?.()
    } catch (error) {
      this.logger.error(`Stream error: ${error}`)
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
    } finally {
      res.end()
    }
  }
}
