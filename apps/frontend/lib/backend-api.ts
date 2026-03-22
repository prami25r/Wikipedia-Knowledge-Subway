import type {
  BackendGraphResponse,
  BackendRouteResponse,
  BackendSearchResponse,
  BackendStationResponse,
  BackendStatsResponse,
} from '@/types/backend';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';
const CACHE_TTL_MS = 30_000;

const cache = new Map<string, { expiresAt: number; value: unknown }>();

async function getJson<T>(path: string, useCache = true): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const cached = cache.get(url);

  if (useCache && cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const response = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status}) for ${path}`);
  }

  const data = (await response.json()) as T;
  if (useCache) {
    cache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, value: data });
  }

  return data;
}

export const backendApi = {
  getGraph() {
    return getJson<BackendGraphResponse>('/api/graph');
  },
  getStation(id: string) {
    return getJson<BackendStationResponse>(`/api/station/${encodeURIComponent(id)}`, false);
  },
  search(query: string) {
    return getJson<BackendSearchResponse>(`/api/search?q=${encodeURIComponent(query)}`, false);
  },
  getRoute(start: string, end: string) {
    return getJson<BackendRouteResponse>(`/api/route?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, false);
  },
  getStats() {
    return getJson<BackendStatsResponse>('/api/stats');
  },
};
