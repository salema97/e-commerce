import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { KnowledgeIndexQueueService } from './knowledge-index-queue.service.js';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto.js';

@Injectable()
export class FaqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indexQueue: KnowledgeIndexQueueService,
  ) {}

  findAll() {
    return this.prisma.faq.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
  }

  findPublished() {
    return this.prisma.faq.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateFaqDto) {
    const faq = await this.prisma.faq.create({ data: dto });
    await this.indexQueue.enqueueFaq(faq.id);
    return faq;
  }

  async update(id: string, dto: UpdateFaqDto) {
    await this.ensureExists(id);
    const faq = await this.prisma.faq.update({ where: { id }, data: dto });
    await this.indexQueue.enqueueFaq(faq.id);
    return faq;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.indexQueue.enqueueDeleteSource('FAQ', id);
    return this.prisma.faq.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ ${id} not found`);
    }
  }
}
