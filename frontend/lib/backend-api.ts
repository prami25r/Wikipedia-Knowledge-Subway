import type {
  BackendGraphResponse,
  BackendLineDetailResponse,
  BackendLinesResponse,
  BackendRouteResponse,
  BackendSearchResponse,
  BackendStationResponse,
  BackendStatsResponse,
} from '@/types/backend';

const CACHE_TTL_MS = 30_000;

const cache = new Map<string, { expiresAt: number; value: unknown }>();

async function getJson<T>(path: string, useCache = true): Promise<T> {
  const cached = cache.get(path);

  if (useCache && cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const response = await fetch(path, { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status}) for ${path}`);
  }

  const data = (await response.json()) as T;
  if (useCache) {
    cache.set(path, { expiresAt: Date.now() + CACHE_TTL_MS, value: data });
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
  getLines() {
    return getJson<BackendLinesResponse>('/api/lines');
  },
  getLine(cluster: string) {
    return getJson<BackendLineDetailResponse>(`/api/line/${encodeURIComponent(cluster)}`);
  },
  getStats() {
    return getJson<BackendStatsResponse>('/api/stats');
  },
};
