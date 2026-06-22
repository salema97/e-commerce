export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: Category | null;
  children?: Category[];
}

export type CreateCategoryDto = {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
};

export type UpdateCategoryDto = Partial<CreateCategoryDto>;
