import type { NextRequest } from 'next/server';
import { proxyBackendGet } from '@/lib/backend-proxy';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ cluster: string }> }) {
  const { cluster } = await context.params;
  return proxyBackendGet(request, `/api/line/${encodeURIComponent(cluster)}`);
}
