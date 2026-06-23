import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodError } from 'zod';
import { messageContentSchema } from '@repo/shared-utils';
import { MessageService } from './message.service.js';
import { ListMessagesQueryDto } from './dto/list-messages.query.dto.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { Audit } from '../audit/audit.decorator.js';

@ApiTags('Messages')
@Controller('conversations/:conversationId/messages')
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  @ApiOperation({ summary: 'List messages for a conversation' })
  @ApiResponse({ status: 200, description: 'Paginated messages' })
  findAll(
    @Param('conversationId') conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.messageService.findAllByConversation(conversationId, query);
  }

  @Post()
  @Audit({ resource: 'message', action: 'create' })
  @ApiOperation({ summary: 'Send an outbound message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent and persisted' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async create(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    try {
      messageContentSchema.parse(createMessageDto.content);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.flatten());
      }
      throw error;
    }

    return this.messageService.createOutbound(conversationId, createMessageDto);
  }
}
