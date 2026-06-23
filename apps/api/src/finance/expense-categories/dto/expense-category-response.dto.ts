export class ExpenseCategoryResponseDto {
  id!: string;
  name!: string;
  description?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
