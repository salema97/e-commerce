import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/public.decorator.js';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service.js';
import { CreateChatSessionDto, SendChatMessageDto } from './dto/chat.dto.js';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a web chat session' })
  createSession(@Body() dto: CreateChatSessionDto) {
    return this.chatService.createSession(dto.contactName);
  }

  @Post('sessions/:sessionId/messages')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Send a message in a web chat session' })
  sendMessage(@Param('sessionId') sessionId: string, @Body() dto: SendChatMessageDto) {
    return this.chatService.sendMessage(sessionId, dto.content);
  }

  @Get('sessions/:sessionId/messages')
  @Public()
  @ApiOperation({ summary: 'List messages for a web chat session' })
  listMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.listMessages(sessionId);
  }
}
