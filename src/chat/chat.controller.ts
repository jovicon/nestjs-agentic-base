import { Body, Controller, Post, Req } from '@nestjs/common'
import { Request } from 'express'
import { ChatService } from './chat.service.js'
import { ChatRequestDto } from './dto/chat-request.dto.js'
import { ApiResponseDto } from '../common/dto/api-response.dto.js'
import { ChatResponseDto } from './dto/chat-response.dto.js'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Body() dto: ChatRequestDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<ChatResponseDto>> {
    const user = req.user as { userId: string }
    const result = await this.chatService.processMessage(dto, user.userId)
    return ApiResponseDto.ok(result)
  }
}
