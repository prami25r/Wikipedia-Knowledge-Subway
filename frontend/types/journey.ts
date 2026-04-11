export type JourneyStep = {
  nodeId: string;
  label: string;
  cluster: string;
  timestamp: number;
};

export type JourneyEdge = {
  source: string;
  target: string;
  count: number;
};

export type JourneyRecord = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  steps: JourneyStep[];
  streakDayKey: string;
  mode: 'free' | 'challenge';
  challenge?: {
    startNodeId: string;
    targetNodeId: string;
    completed: boolean;
    attempts: number;
    bestDistance: number | null;
  };
};

export type JourneyMetrics = {
  totalNodesVisited: number;
  uniqueNodesVisited: number;
  transitionCount: number;
  longestTraversalPath: number;
  domainsCovered: string[];
  rareTransitions: Array<{ source: string; target: string }>;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export type GlobalTraversalSnapshot = {
  updatedAt: number;
  edgeWeights: Array<{ source: string; target: string; weight: number }>;
  nodeVisits: Array<{ nodeId: string; visits: number }>;
  journeys: Array<{
    id: string;
    alias: string;
    score: number;
    totalNodes: number;
    longestPath: number;
    domains: number;
    rareEdgeCount: number;
    createdAt: number;
  }>;
};
