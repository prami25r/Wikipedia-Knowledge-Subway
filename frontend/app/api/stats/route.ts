import type { NextRequest } from 'next/server';
import { proxyBackendGet } from '@/lib/backend-proxy';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return proxyBackendGet(request, '/api/stats');
}
