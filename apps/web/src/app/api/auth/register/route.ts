import { NextResponse } from 'next/server';
import { proxyAuth } from '@/lib/auth-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAuth('register', body);
}
