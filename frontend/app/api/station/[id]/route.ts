import type { NextRequest } from 'next/server';
import { proxyBackendGet } from '@/lib/backend-proxy';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyBackendGet(request, `/api/station/${encodeURIComponent(id)}`);
}
