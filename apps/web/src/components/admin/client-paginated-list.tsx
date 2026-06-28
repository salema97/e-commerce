'use client';

import * as React from 'react';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { ADMIN_TABLE_PAGE_SIZE, getPageSlice, getTotalPages } from '@/lib/pagination';
import { cn } from '@/lib/utils';

interface ClientPaginatedListProps<T> {
  items: T[];
  pageSize?: number;
  className?: string;
  paginationClassName?: string;
  children: (pageItems: T[]) => React.ReactNode;
}

export function ClientPaginatedList<T>({
  items,
  pageSize = ADMIN_TABLE_PAGE_SIZE,
  className,
  paginationClassName,
  children,
}: ClientPaginatedListProps<T>) {
  const [page, setPage] = React.useState(1);
  const total = items.length;
  const totalPages = getTotalPages(total, pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = getPageSlice(items, safePage, pageSize);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [page, totalPages]);

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {children(pageItems)}
      <PaginationBar
        className={cn('mt-6', paginationClassName)}
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
