import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { WhatsAppQuickReplyService, type QuickReplyRecord } from './whatsapp-quick-reply.service.js';
import { CreateWhatsAppQuickReplyDto } from './dto/create-whatsapp-quick-reply.dto.js';
import { UpdateWhatsAppQuickReplyDto } from './dto/update-whatsapp-quick-reply.dto.js';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly quickReplyService: WhatsAppQuickReplyService) {}

  @Get('quick-replies')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active quick reply templates' })
  getQuickReplies(): Promise<QuickReplyRecord[]> {
    return this.quickReplyService.findActive();
  }

  @Get('quick-replies/admin')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all quick reply templates (admin)' })
  listQuickRepliesAdmin(): Promise<QuickReplyRecord[]> {
    return this.quickReplyService.findAllAdmin();
  }

  @Post('quick-replies')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a quick reply template' })
  createQuickReply(@Body() dto: CreateWhatsAppQuickReplyDto): Promise<QuickReplyRecord> {
    return this.quickReplyService.create(dto);
  }

  @Patch('quick-replies/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a quick reply template' })
  updateQuickReply(
    @Param('id') id: string,
    @Body() dto: UpdateWhatsAppQuickReplyDto,
  ): Promise<QuickReplyRecord> {
    return this.quickReplyService.update(id, dto);
  }

  @Delete('quick-replies/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a quick reply template' })
  async deleteQuickReply(@Param('id') id: string): Promise<{ deleted: true }> {
    await this.quickReplyService.remove(id);
    return { deleted: true };
  }
}
