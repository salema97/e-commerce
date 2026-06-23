'use client';

import * as React from 'react';
import { FileText, FileDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InvoiceStatus } from '@repo/shared-types';
import {
  retryInvoice,
  retryCreditNote,
  getInvoiceDownloadUrl,
  getCreditNoteDownloadUrl,
} from '@/app/admin/invoices/actions';

interface InvoiceActionsProps {
  id: string;
  documentType?: 'invoice' | 'credit-note';
  status: InvoiceStatus;
  onRetry?: () => void;
  disabled?: boolean;
}

export function InvoiceActions({
  id,
  documentType = 'invoice',
  status,
  onRetry,
  disabled = false,
}: InvoiceActionsProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState<'xml' | 'pdf' | null>(null);
  const canRetry = status === 'FAILED' || status === 'REJECTED' || status === 'DRAFT';

  async function handleRetry() {
    setIsRetrying(true);
    try {
      if (documentType === 'credit-note') {
        await retryCreditNote(id);
      } else {
        await retryInvoice(id);
      }
      onRetry?.();
    } finally {
      setIsRetrying(false);
    }
  }

  async function handleDownload(type: 'xml' | 'pdf') {
    setIsDownloading(type);
    try {
      const url =
        documentType === 'credit-note'
          ? await getCreditNoteDownloadUrl(id, type)
          : await getInvoiceDownloadUrl(id, type);
      window.open(url, '_blank');
    } finally {
      setIsDownloading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {canRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isRetrying}
          onClick={handleRetry}
        >
          <RefreshCw className={`size-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Reintentando...' : 'Reintentar'}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isDownloading === 'xml'}
        onClick={() => handleDownload('xml')}
      >
        <FileText className="size-4" />
        XML
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isDownloading === 'pdf'}
        onClick={() => handleDownload('pdf')}
      >
        <FileDown className="size-4" />
        PDF
      </Button>
    </div>
  );
}
