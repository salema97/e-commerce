import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessageService } from './message.service.js';
import { ListMessagesQueryDto } from './dto/list-messages.query.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';

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
}
