'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileDown, FileText, MoreHorizontal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InvoiceStatus } from '@repo/shared-types';
import {
  retryInvoice,
  retryCreditNote,
  getInvoiceDownloadUrl,
  getCreditNoteDownloadUrl,
} from '@/app/admin/invoices/actions';

interface InvoiceRowActionsProps {
  id: string;
  documentType?: 'invoice' | 'credit-note';
  status: InvoiceStatus;
  onRetry?: () => void;
  disabled?: boolean;
}

export function InvoiceRowActions({
  id,
  documentType = 'invoice',
  status,
  onRetry,
  disabled = false,
}: InvoiceRowActionsProps) {
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
      toast.success('Reintento de factura encolado');
      onRetry?.();
    } catch {
      toast.error('No se pudo reintentar el comprobante');
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
      toast.success(`Descarga ${type.toUpperCase()} iniciada`);
    } catch {
      toast.error(`No se pudo descargar el ${type.toUpperCase()}`);
    } finally {
      setIsDownloading(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} aria-label="Acciones de factura">
          <MoreHorizontal className="size-4" />
          Acciones
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/invoices/${id}`}>Ver detalle</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {canRetry ? (
          <DropdownMenuItem disabled={isRetrying} onSelect={() => void handleRetry()}>
            <RefreshCw className={`size-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Reintentando…' : 'Reintentar envío SRI'}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          disabled={isDownloading === 'xml'}
          onSelect={() => void handleDownload('xml')}
        >
          <FileText className="size-4" />
          Descargar XML
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isDownloading === 'pdf'}
          onSelect={() => void handleDownload('pdf')}
        >
          <FileDown className="size-4" />
          Descargar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
