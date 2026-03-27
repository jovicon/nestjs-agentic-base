import { Inject, Injectable, Logger } from '@nestjs/common'
import { MASTRA_AGENT } from '../../common/constants/injection-tokens.js'
import type { ChatContext } from '../../common/interfaces/chat-context.interface.js'
import type { AgentResponse } from '../../common/interfaces/agent-response.interface.js'

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)

  constructor(@Inject(MASTRA_AGENT) private readonly agent: any) {}

  async generate(message: string, context: ChatContext): Promise<AgentResponse> {
    this.logger.log(`Generating response for thread: ${context.threadId}`)

    const now = new Date()
    const fecha = now.toISOString().split('T')[0]
    const hora = now.toTimeString().split(' ')[0]
    const contextParts = [`[Contexto de sesión: fecha = ${fecha}, hora = ${hora}`]
    if (context.rut) contextParts.push(`, RUT del ejecutivo = ${context.rut}`)
    const contextMessage = contextParts.join('') + ']\n\n'

    const result = await this.agent.generate(`${contextMessage}${message}`, {
      threadId: context.threadId,
      resourceId: context.resourceId,
    })

    return {
      text: result.text,
      threadId: context.threadId,
      sources: result.sources ?? [],
    }
  }

  async stream(message: string, context: ChatContext) {
    this.logger.log(`Streaming response for thread: ${context.threadId}`)

    const now = new Date()
    const fecha = now.toISOString().split('T')[0]
    const hora = now.toTimeString().split(' ')[0]
    const contextParts = [`[Contexto de sesión: fecha = ${fecha}, hora = ${hora}`]
    if (context.rut) contextParts.push(`, RUT del ejecutivo = ${context.rut}`)
    const contextMessage = contextParts.join('') + ']\n\n'

    return this.agent.stream(`${contextMessage}${message}`, {
      threadId: context.threadId,
      resourceId: context.resourceId,
    })
  }
}
