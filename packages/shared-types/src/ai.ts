export interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  score: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductContentDraft {
  id: string;
  productId: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  imageAlts?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatSession {
  id: string;
  webSessionId: string;
  contactName?: string | null;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  bodyMarkdown: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFaqDto {
  question: string;
  answer: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface UpdateFaqDto {
  question?: string;
  answer?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CreateCmsPageDto {
  slug: string;
  title: string;
  bodyMarkdown: string;
  isPublished?: boolean;
}

export interface UpdateCmsPageDto {
  slug?: string;
  title?: string;
  bodyMarkdown?: string;
  isPublished?: boolean;
}
