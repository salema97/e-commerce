import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConversationService } from './conversation.service.js';
import { ListConversationsQueryDto } from './dto/list-conversations.query.dto.js';
import { UpdateConversationDto } from './dto/update-conversation.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { Audit } from '../audit/audit.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Conversations')
@Controller('conversations')
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @ApiOperation({ summary: 'List conversations' })
  @ApiResponse({ status: 200, description: 'Paginated conversations' })
  findAll(
    @Query() query: ListConversationsQueryDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.conversationService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation by id' })
  @ApiResponse({ status: 200, description: 'Conversation found' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  findOne(@Param('id') id: string) {
    return this.conversationService.findOne(id);
  }

  @Patch(':id')
  @Audit({ resource: 'conversation', action: 'update' })
  @ApiOperation({ summary: 'Update conversation status or assigned agent' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationService.update(id, updateConversationDto);
  }
}
