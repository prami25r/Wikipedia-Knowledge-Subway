'use client';

import type { BackendNode } from '@/types/backend';
import type { Achievement, JourneyMetrics, JourneyRecord, JourneyStep } from '@/types/journey';

const STORAGE_KEY = 'wks_journeys_v1';
const ACTIVE_JOURNEY_KEY = 'wks_active_journey';
const STREAK_KEY = 'wks_streak_v1';

type StreakState = {
  currentStreak: number;
  lastActiveDayKey: string | null;
  longestStreak: number;
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getDayKey(timestamp = Date.now()): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function edgeKey(source: string, target: string): string {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}

function readJourneys(): JourneyRecord[] {
  if (typeof window === 'undefined') return [];
  return safeParse<JourneyRecord[]>(window.localStorage.getItem(STORAGE_KEY), []);
}

function writeJourneys(journeys: JourneyRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}

function readActiveJourneyId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_JOURNEY_KEY);
}

function writeActiveJourneyId(journeyId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_JOURNEY_KEY, journeyId);
}

function readStreak(): StreakState {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, lastActiveDayKey: null, longestStreak: 0 };
  }
  return safeParse<StreakState>(window.localStorage.getItem(STREAK_KEY), {
    currentStreak: 0,
    lastActiveDayKey: null,
    longestStreak: 0,
  });
}

function writeStreak(streak: StreakState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

function ensureActiveJourney(): JourneyRecord {
  const journeys = readJourneys();
  const activeJourneyId = readActiveJourneyId();
  const active = journeys.find((entry) => entry.id === activeJourneyId);
  if (active) return active;

  const now = Date.now();
  const created: JourneyRecord = {
    id: `journey_${now}`,
    name: 'Current Session',
    createdAt: now,
    updatedAt: now,
    steps: [],
    streakDayKey: getDayKey(now),
    mode: 'free',
  };

  writeJourneys([created, ...journeys]);
  writeActiveJourneyId(created.id);
  return created;
}

export function listJourneys(): JourneyRecord[] {
  return readJourneys().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function startNamedJourney(name: string, mode: 'free' | 'challenge', challenge?: JourneyRecord['challenge']): JourneyRecord {
  const journeys = readJourneys();
  const now = Date.now();
  const created: JourneyRecord = {
    id: `journey_${now}`,
    name: name.trim() || 'Untitled Journey',
    createdAt: now,
    updatedAt: now,
    steps: [],
    streakDayKey: getDayKey(now),
    mode,
    challenge,
  };

  writeJourneys([created, ...journeys]);
  writeActiveJourneyId(created.id);
  return created;
}

export function getActiveJourney(): JourneyRecord {
  return ensureActiveJourney();
}

export function getStreakState(): StreakState {
  return readStreak();
}

export function trackNodeVisit(node: BackendNode): JourneyRecord {
  const journeys = readJourneys();
  const active = ensureActiveJourney();
  const nextStep: JourneyStep = {
    nodeId: node.id,
    label: node.label,
    cluster: node.cluster,
    timestamp: Date.now(),
  };

  const updated: JourneyRecord = {
    ...active,
    steps: [...active.steps, nextStep],
    updatedAt: Date.now(),
  };

  const merged = [updated, ...journeys.filter((entry) => entry.id !== updated.id)];
  writeJourneys(merged);

  const dayKey = getDayKey();
  const streak = readStreak();
  if (streak.lastActiveDayKey !== dayKey) {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayKey = getDayKey(yesterday.getTime());
    const nextCurrent = streak.lastActiveDayKey === yesterdayKey ? streak.currentStreak + 1 : 1;
    writeStreak({
      currentStreak: nextCurrent,
      lastActiveDayKey: dayKey,
      longestStreak: Math.max(streak.longestStreak, nextCurrent),
    });
  }

  return updated;
}

export function computeJourneyMetrics(journey: JourneyRecord): JourneyMetrics {
  const uniqueNodes = new Set(journey.steps.map((step) => step.nodeId));
  const domains = new Set(journey.steps.map((step) => step.cluster));

  const edgeCounts = new Map<string, number>();
  for (let index = 0; index < journey.steps.length - 1; index += 1) {
    const source = journey.steps[index];
    const target = journey.steps[index + 1];
    const key = edgeKey(source.nodeId, target.nodeId);
    edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
  }

  let currentChain = 0;
  let longestChain = 0;
  const chainSet = new Set<string>();

  for (const step of journey.steps) {
    if (chainSet.has(step.nodeId)) {
      chainSet.clear();
      currentChain = 0;
    }
    chainSet.add(step.nodeId);
    currentChain += 1;
    longestChain = Math.max(longestChain, currentChain);
  }

  const rareTransitions = Array.from(edgeCounts.entries())
    .filter(([, count]) => count === 1)
    .map(([value]) => {
      const [source, target] = value.split('::');
      return { source, target };
    });

  return {
    totalNodesVisited: journey.steps.length,
    uniqueNodesVisited: uniqueNodes.size,
    transitionCount: Math.max(0, journey.steps.length - 1),
    longestTraversalPath: longestChain,
    domainsCovered: Array.from(domains),
    rareTransitions,
  };
}

export function getJourneyAchievements(journey: JourneyRecord): Achievement[] {
  const metrics = computeJourneyMetrics(journey);
  const timestamps = journey.steps.map((step) => step.timestamp);

  let largeTimeGap = false;
  for (let index = 0; index < timestamps.length - 1; index += 1) {
    const gapHours = Math.abs(timestamps[index + 1] - timestamps[index]) / (1000 * 60 * 60);
    if (gapHours >= 24) {
      largeTimeGap = true;
      break;
    }
  }

  return [
    {
      id: 'cross-domain-explorer',
      title: 'Cross-domain explorer',
      description: 'Traverse at least 3 domains in one journey.',
      unlocked: metrics.domainsCovered.length >= 3,
    },
    {
      id: 'time-traveler',
      title: 'Time traveler',
      description: 'Return after a 24h+ time gap and continue the same journey.',
      unlocked: largeTimeGap,
    },
    {
      id: 'deep-diver',
      title: 'Deep diver',
      description: 'Build a non-repeating chain with 12+ stations.',
      unlocked: metrics.longestTraversalPath >= 12,
    },
  ];
}

export function buildReplayFrames(journey: JourneyRecord): Array<{ nodeId: string; at: number }> {
  const durationMs = Math.min(10_000, Math.max(5_000, journey.steps.length * 450));
  if (journey.steps.length === 0) return [];

  return journey.steps.map((step, index) => ({
    nodeId: step.nodeId,
    at: Math.floor((index / Math.max(1, journey.steps.length - 1)) * durationMs),
  }));
}

export function scoreJourney(journey: JourneyRecord): number {
  const metrics = computeJourneyMetrics(journey);
  return metrics.uniqueNodesVisited * 2 + metrics.longestTraversalPath * 3 + metrics.domainsCovered.length * 8 + metrics.rareTransitions.length * 5;
}

export function buildShareCardSvg(journey: JourneyRecord): string {
  const metrics = computeJourneyMetrics(journey);
  const escapedName = journey.name.replace(/[<>&]/g, '');
  const lines = [
    `Wikipedia Knowledge Subway`,
    `${escapedName}`,
    `Nodes: ${metrics.uniqueNodesVisited} | Domains: ${metrics.domainsCovered.length}`,
    `Longest path: ${metrics.longestTraversalPath} | Rare paths: ${metrics.rareTransitions.length}`,
  ];

  const text = lines
    .map((line, index) => `<text x="40" y="${70 + index * 42}" fill="#E7F0FF" font-size="24" font-family="Inter, Arial">${line}</text>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#08101A"/><circle cx="140" cy="500" r="28" fill="#4DA3FF"/><circle cx="310" cy="470" r="24" fill="#D9BA84"/><circle cx="480" cy="520" r="20" fill="#78B5F2"/><path d="M140 500 L310 470 L480 520" stroke="#FFFFFF" stroke-width="5" fill="none" opacity="0.6"/>${text}</svg>`;
}
