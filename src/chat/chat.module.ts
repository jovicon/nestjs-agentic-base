import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller.js'
import { ChatService } from './chat.service.js'
import { MastraModule } from '../mastra/mastra.module.js'

@Module({
  imports: [MastraModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
