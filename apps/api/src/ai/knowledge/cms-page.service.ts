import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { KnowledgeIndexingService } from './knowledge-indexing.service.js';
import { CreateCmsPageDto, UpdateCmsPageDto } from './dto/cms-page.dto.js';

@Injectable()
export class CmsPageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indexing: KnowledgeIndexingService,
  ) {}

  findPublishedBySlug(slug: string) {
    return this.prisma.cmsPage.findFirst({ where: { slug, isPublished: true } });
  }

  findAll() {
    return this.prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async create(dto: CreateCmsPageDto) {
    const page = await this.prisma.cmsPage.create({ data: dto });
    await this.indexing.indexCmsPage(page.id);
    return page;
  }

  async update(id: string, dto: UpdateCmsPageDto) {
    await this.ensureExists(id);
    const page = await this.prisma.cmsPage.update({ where: { id }, data: dto });
    await this.indexing.indexCmsPage(page.id);
    return page;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.knowledgeChunk.deleteMany({ where: { sourceType: 'CMS_PAGE', sourceId: id } });
    return this.prisma.cmsPage.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const page = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException(`CMS page ${id} not found`);
    }
  }
}
