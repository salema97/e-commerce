'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { InvoiceResponseDto } from '@repo/shared-types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/v1';

async function getAuthToken(): Promise<string | null> {
  const { getToken } = await auth();
  return getToken();
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function retryInvoice(id: string): Promise<InvoiceResponseDto> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/invoices/${id}/retry`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Retry failed' }));
    throw new Error(data.message ?? 'Retry failed');
  }

  return response.json();
}

export async function retryCreditNote(id: string): Promise<unknown> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/credit-notes/${id}/retry`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Retry failed' }));
    throw new Error(data.message ?? 'Retry failed');
  }

  return response.json();
}

export async function getInvoiceDownloadUrl(
  id: string,
  type: 'xml' | 'pdf',
): Promise<string> {
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

  // Fallback: if the endpoint did not redirect, treat as a route that should
  // be opened directly (e.g. test environments without signed URLs).
  return `${API_BASE_URL}/invoices/${id}/${type}`;
}

export async function getCreditNoteDownloadUrl(
  id: string,
  type: 'xml' | 'pdf',
): Promise<string> {
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
  redirect(`/admin/invoices/${id}`);
}
