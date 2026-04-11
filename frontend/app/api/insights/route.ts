import { NextResponse } from 'next/server';

type JourneySubmission = {
  alias: string;
  edges: Array<{ source: string; target: string }>;
  nodes: string[];
  score: number;
  totalNodes: number;
  longestPath: number;
  domains: number;
  rareEdgeCount: number;
};

type InsightStore = {
  edgeWeights: Map<string, number>;
  nodeVisits: Map<string, number>;
  journeys: Array<JourneySubmission & { id: string; createdAt: number }>;
  updatedAt: number;
};

const globalStore = globalThis as typeof globalThis & { __wksInsights?: InsightStore };

function getStore(): InsightStore {
  if (!globalStore.__wksInsights) {
    globalStore.__wksInsights = {
      edgeWeights: new Map(),
      nodeVisits: new Map(),
      journeys: [],
      updatedAt: Date.now(),
    };
  }

  return globalStore.__wksInsights;
}

function edgeKey(source: string, target: string): string {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}

export async function GET() {
  const store = getStore();
  const edgeWeights = Array.from(store.edgeWeights.entries())
    .map(([key, weight]) => {
      const [source, target] = key.split('::');
      return { source, target, weight };
    })
    .sort((a, b) => b.weight - a.weight);

  const nodeVisits = Array.from(store.nodeVisits.entries())
    .map(([nodeId, visits]) => ({ nodeId, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 30);

  const journeys = store.journeys
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  return NextResponse.json({
    updatedAt: store.updatedAt,
    edgeWeights,
    nodeVisits,
    journeys,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as JourneySubmission;
  const store = getStore();

  for (const edge of payload.edges) {
    const key = edgeKey(edge.source, edge.target);
    store.edgeWeights.set(key, (store.edgeWeights.get(key) ?? 0) + 1);
  }

  for (const nodeId of payload.nodes) {
    store.nodeVisits.set(nodeId, (store.nodeVisits.get(nodeId) ?? 0) + 1);
  }

  store.journeys.unshift({
    ...payload,
    id: `journey_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: Date.now(),
  });
  store.journeys = store.journeys.slice(0, 250);
  store.updatedAt = Date.now();

  return NextResponse.json({ ok: true });
}
