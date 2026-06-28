'use client';

import { Button } from '@/components/ui/button';
import {
  getTotalPages,
  shouldShowOffsetPagination,
  shouldShowPagination,
} from '@/lib/pagination';
import { cn } from '@/lib/utils';

interface PaginationBarBaseProps {
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

interface PaginationBarWithTotalProps extends PaginationBarBaseProps {
  total: number;
  hasNextPage?: never;
}

interface PaginationBarWithOffsetProps extends PaginationBarBaseProps {
  total?: never;
  hasNextPage: boolean;
  currentPageCount: number;
}

export type PaginationBarProps = PaginationBarWithTotalProps | PaginationBarWithOffsetProps;

export function PaginationBar(props: PaginationBarProps) {
  const { page, pageSize, onPageChange, disabled = false, className } = props;

  if ('total' in props && props.total !== undefined) {
    if (!shouldShowPagination(props.total, pageSize)) {
      return null;
    }

    const totalPages = getTotalPages(props.total, pageSize);

    return (
      <div className={cn('flex items-center justify-between', className)}>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm font-bold uppercase">
          Página {page} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    );
  }

  const { hasNextPage, currentPageCount } = props;

  if (!shouldShowOffsetPagination(page, pageSize, currentPageCount)) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </Button>
      <span className="text-sm font-bold uppercase">Página {page}</span>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !hasNextPage}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
      </Button>
    </div>
  );
}
