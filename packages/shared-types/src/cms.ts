export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  bodyMarkdown: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}
