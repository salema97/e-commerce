'use server';

import { redirect } from 'next/navigation';
import type { InvoiceResponseDto } from '@repo/shared-types';
import { financeRoles } from '@/lib/auth';
import { requireServerAuthToken, requireServerRoles } from '@/lib/server-action-auth';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/v1';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await requireServerAuthToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function retryInvoice(id: string): Promise<InvoiceResponseDto> {
  await requireServerRoles(financeRoles, '/sign-in?redirect_url=/admin/invoices');
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/invoices/${id}/retry`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Error al reintentar' }));
    throw new Error(data.message ?? 'Error al reintentar');
  }

  return response.json();
}

export async function retryCreditNote(id: string): Promise<unknown> {
  await requireServerRoles(financeRoles, '/sign-in?redirect_url=/admin/invoices/credit-notes');
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/credit-notes/${id}/retry`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Error al reintentar' }));
    throw new Error(data.message ?? 'Error al reintentar');
  }

  return response.json();
}

export async function getInvoiceDownloadUrl(
  id: string,
  type: 'xml' | 'pdf',
): Promise<string> {
  await requireServerRoles(financeRoles, '/sign-in?redirect_url=/admin/invoices');
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/invoices/${id}/${type}`, {
    method: 'GET',
    headers,
    redirect: 'manual',
  });

  const location = response.headers.get('location');
  if (location) {
    return location;
  }

  return `${API_BASE_URL}/invoices/${id}/${type}`;
}

export async function getCreditNoteDownloadUrl(
  id: string,
  type: 'xml' | 'pdf',
): Promise<string> {
  await requireServerRoles(financeRoles, '/sign-in?redirect_url=/admin/invoices/credit-notes');
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/credit-notes/${id}/${type}`, {
    method: 'GET',
    headers,
    redirect: 'manual',
  });

  const location = response.headers.get('location');
  if (location) {
    return location;
  }

  return `${API_BASE_URL}/credit-notes/${id}/${type}`;
}

export async function redirectToInvoiceDetail(id: string): Promise<never> {
  await requireServerRoles(financeRoles, '/sign-in?redirect_url=/admin/invoices');
  redirect(`/admin/invoices/${id}`);
}
