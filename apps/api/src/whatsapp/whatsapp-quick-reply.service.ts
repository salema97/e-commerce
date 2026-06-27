import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWhatsAppQuickReplyDto } from './dto/create-whatsapp-quick-reply.dto.js';
import { UpdateWhatsAppQuickReplyDto } from './dto/update-whatsapp-quick-reply.dto.js';

export interface QuickReplyRecord {
  id: string;
  label: string;
  text: string;
}

const DEFAULT_QUICK_REPLIES: Array<{ label: string; text: string; sortOrder: number }> = [
  {
    label: 'Saludo',
    text: '¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte hoy?',
    sortOrder: 0,
  },
  {
    label: 'Estado del pedido',
    text: 'Con gusto reviso el estado de tu pedido. ¿Podrías indicarnos el número de orden?',
    sortOrder: 1,
  },
  {
    label: 'Envío',
    text: 'Tu pedido está en proceso de envío. En cuanto tengamos la guía de rastreo te la compartimos.',
    sortOrder: 2,
  },
  {
    label: 'Horario de atención',
    text: 'Nuestro horario de atención es de lunes a viernes de 08:00 a 18:00 y sábados de 09:00 a 13:00.',
    sortOrder: 3,
  },
  {
    label: 'Agradecimiento',
    text: 'Gracias por tu compra. Si necesitas algo más, estamos para ayudarte.',
    sortOrder: 4,
  },
];

@Injectable()
export class WhatsAppQuickReplyService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(): Promise<QuickReplyRecord[]> {
    await this.ensureDefaults();
    const rows = await this.prisma.whatsAppQuickReply.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => ({ id: row.id, label: row.label, text: row.text }));
  }

  async findAllAdmin(): Promise<QuickReplyRecord[]> {
    await this.ensureDefaults();
    const rows = await this.prisma.whatsAppQuickReply.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => ({ id: row.id, label: row.label, text: row.text }));
  }

  async create(dto: CreateWhatsAppQuickReplyDto): Promise<QuickReplyRecord> {
    const row = await this.prisma.whatsAppQuickReply.create({
      data: {
        label: dto.label.trim(),
        text: dto.text.trim(),
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    return { id: row.id, label: row.label, text: row.text };
  }

  async update(id: string, dto: UpdateWhatsAppQuickReplyDto): Promise<QuickReplyRecord> {
    await this.findOneOrThrow(id);
    const row = await this.prisma.whatsAppQuickReply.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label.trim() }),
        ...(dto.text !== undefined && { text: dto.text.trim() }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return { id: row.id, label: row.label, text: row.text };
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrThrow(id);
    await this.prisma.whatsAppQuickReply.delete({ where: { id } });
  }

  private async findOneOrThrow(id: string) {
    const row = await this.prisma.whatsAppQuickReply.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Quick reply ${id} not found`);
    }
    return row;
  }

  private async ensureDefaults(): Promise<void> {
    const count = await this.prisma.whatsAppQuickReply.count();
    if (count > 0) {
      return;
    }
    await this.prisma.whatsAppQuickReply.createMany({
      data: DEFAULT_QUICK_REPLIES,
    });
  }
}
