import { Body, Controller, Post, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
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
    const user = req.user as { userId: string; rut?: string }
    const result = await this.chatService.processMessage(dto, user.userId, user.rut)
    return ApiResponseDto.ok(result)
  }

  @Post('stream')
  async stream(
    @Body() dto: ChatRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user as { userId: string; rut?: string }
    await this.chatService.streamMessage(dto, user.userId, user.rut, res)
  }
}
