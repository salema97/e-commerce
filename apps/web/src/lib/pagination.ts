export const STORE_CATALOG_PAGE_SIZE = 12;
export const ADMIN_TABLE_PAGE_SIZE = 10;

export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Hide pagination when everything fits on one page. */
export function shouldShowPagination(total: number, pageSize: number): boolean {
  return total > pageSize;
}

/** For offset-based APIs without a total count. */
export function shouldShowOffsetPagination(
  page: number,
  pageSize: number,
  currentPageCount: number,
): boolean {
  return page > 1 || currentPageCount >= pageSize;
}

export function getPageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
