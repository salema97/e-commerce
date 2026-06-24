import type { KnowledgeSourceType } from '@prisma/client';

export enum KnowledgeIndexJobName {
  INDEX_FAQ = 'INDEX_FAQ',
  INDEX_CMS_PAGE = 'INDEX_CMS_PAGE',
  INDEX_PRODUCT = 'INDEX_PRODUCT',
  DELETE_SOURCE = 'DELETE_SOURCE',
}

export interface IndexFaqJobData {
  faqId: string;
}

export interface IndexCmsPageJobData {
  pageId: string;
}

export interface IndexProductJobData {
  productId: string;
}

export interface DeleteSourceJobData {
  sourceType: KnowledgeSourceType;
  sourceId: string;
}
