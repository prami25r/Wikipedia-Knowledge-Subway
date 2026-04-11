import type { GlobalTraversalSnapshot } from '@/types/journey';

export type JourneySubmission = {
  alias: string;
  edges: Array<{ source: string; target: string }>;
  nodes: string[];
  score: number;
  totalNodes: number;
  longestPath: number;
  domains: number;
  rareEdgeCount: number;
};

export const insightsApi = {
  async getSnapshot(): Promise<GlobalTraversalSnapshot> {
    const response = await fetch('/api/insights', { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to load traversal insights');
    }
    return (await response.json()) as GlobalTraversalSnapshot;
  },

  async submitJourney(payload: JourneySubmission): Promise<void> {
    await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};
