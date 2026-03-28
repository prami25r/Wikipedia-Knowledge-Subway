import 'server-only';
import type {
  BackendLineDetailResponse,
  BackendLinesResponse,
  BackendStationResponse,
  BackendStatsResponse,
} from '@/types/backend';

const DEFAULT_BACKEND_ORIGIN = 'http://127.0.0.1:4000';

function getBackendOrigin(): string {
  return (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_ORIGIN).replace(/\/$/, '');
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getBackendOrigin()}${path}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status}) for ${path}`);
  }

  return (await response.json()) as T;
}

export const serverBackendApi = {
  getStats() {
    return getJson<BackendStatsResponse>('/api/stats');
  },
  getLines() {
    return getJson<BackendLinesResponse>('/api/lines');
  },
  getLine(cluster: string) {
    return getJson<BackendLineDetailResponse>(`/api/line/${encodeURIComponent(cluster)}`);
  },
  getStation(id: string) {
    return getJson<BackendStationResponse>(`/api/station/${encodeURIComponent(id)}`);
  },
};
