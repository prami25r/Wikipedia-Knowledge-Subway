'use client';

import { useEffect, useMemo, useState } from 'react';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import {
  buildReplayFrames,
  buildShareCardSvg,
  computeJourneyMetrics,
  getActiveJourney,
  getJourneyAchievements,
  getStreakState,
  listJourneys,
  scoreJourney,
  startNamedJourney,
} from '@/lib/journey-engine';
import { insightsApi } from '@/lib/insights-api';
import type { GlobalTraversalSnapshot, JourneyRecord } from '@/types/journey';

function buildEdges(journey: JourneyRecord): Array<{ source: string; target: string }> {
  const output: Array<{ source: string; target: string }> = [];
  for (let index = 0; index < journey.steps.length - 1; index += 1) {
    output.push({ source: journey.steps[index].nodeId, target: journey.steps[index + 1].nodeId });
  }
  return output;
}

function getPercentile(journeys: GlobalTraversalSnapshot['journeys'], score: number): number {
  if (journeys.length === 0) return 100;
  const betterCount = journeys.filter((entry) => entry.score > score).length;
  return Math.max(1, Math.round(((journeys.length - betterCount) / journeys.length) * 100));
}

export function KnowledgeSystemsPanel() {
  const graph = useSubwayStore((state) => state.graph);
  const [activeJourney, setActiveJourney] = useState<JourneyRecord | null>(null);
  const [journeys, setJourneys] = useState<JourneyRecord[]>([]);
  const [snapshot, setSnapshot] = useState<GlobalTraversalSnapshot | null>(null);
  const [roomId, setRoomId] = useState('global-room');
  const [liveMembers, setLiveMembers] = useState(1);

  useEffect(() => {
    setActiveJourney(getActiveJourney());
    setJourneys(listJourneys());

    let mounted = true;
    insightsApi
      .getSnapshot()
      .then((value) => {
        if (mounted) setSnapshot(value);
      })
      .catch(() => {
        if (mounted) setSnapshot(null);
      });

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveJourney(getActiveJourney());
      setJourneys(listJourneys());
    }, 1200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeJourney || activeJourney.steps.length < 3) return;
    void insightsApi.submitJourney({
      alias: activeJourney.name,
      edges: buildEdges(activeJourney),
      nodes: activeJourney.steps.map((step) => step.nodeId),
      score: scoreJourney(activeJourney),
      totalNodes: activeJourney.steps.length,
      longestPath: computeJourneyMetrics(activeJourney).longestTraversalPath,
      domains: computeJourneyMetrics(activeJourney).domainsCovered.length,
      rareEdgeCount: computeJourneyMetrics(activeJourney).rareTransitions.length,
    });
  }, [activeJourney]);

  useEffect(() => {
    const channel = new BroadcastChannel(`wks-room-${roomId}`);
    const memberId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    channel.postMessage({ type: 'join', memberId });

    channel.onmessage = (event) => {
      if (event.data?.type === 'join') {
        setLiveMembers((count) => count + 1);
      }
    };

    return () => {
      channel.close();
    };
  }, [roomId]);

  const metrics = useMemo(() => (activeJourney ? computeJourneyMetrics(activeJourney) : null), [activeJourney]);
  const achievements = useMemo(() => (activeJourney ? getJourneyAchievements(activeJourney) : []), [activeJourney]);
  const replayFrames = useMemo(() => (activeJourney ? buildReplayFrames(activeJourney) : []), [activeJourney]);
  const streak = getStreakState();

  const trendingPaths = (snapshot?.edgeWeights ?? []).slice(0, 5);
  const rarePaths = (snapshot?.edgeWeights ?? []).filter((entry) => entry.weight <= 2).slice(0, 5);
  const topJourneys = (snapshot?.journeys ?? []).slice(0, 5);

  const dailyChallenge = useMemo(() => {
    if (!graph || graph.nodes.length < 2) return null;
    const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const startIndex = dayOffset % graph.nodes.length;
    const endIndex = (dayOffset * 7) % graph.nodes.length;
    return {
      start: graph.nodes[startIndex],
      target: graph.nodes[endIndex],
    };
  }, [graph]);

  const startFreeJourney = () => {
    startNamedJourney(`Journey ${new Date().toLocaleDateString()}`, 'free');
    setActiveJourney(getActiveJourney());
    setJourneys(listJourneys());
  };

  const startChallengeJourney = () => {
    if (!dailyChallenge) return;
    const journey = startNamedJourney('Daily challenge run', 'challenge', {
      startNodeId: dailyChallenge.start.id,
      targetNodeId: dailyChallenge.target.id,
      completed: false,
      attempts: 1,
      bestDistance: null,
    });
    subwayActions.selectNode(dailyChallenge.start.id);
    setActiveJourney(journey);
    setJourneys(listJourneys());
  };

  const replayJourney = async () => {
    for (const frame of replayFrames) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      subwayActions.selectNode(frame.nodeId);
    }
  };

  const shareJourney = async () => {
    if (!activeJourney || !metrics) return;
    const summary = `I explored ${metrics.uniqueNodesVisited} nodes across ${metrics.domainsCovered.length} domains on Wikipedia Knowledge Subway.`;
    await navigator.clipboard.writeText(summary);
  };

  const downloadCard = () => {
    if (!activeJourney) return;
    const svg = buildShareCardSvg(activeJourney);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeJourney.name.replace(/\s+/g, '-').toLowerCase()}-share-card.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className='space-y-4 rounded-[28px] border border-theme-border bg-theme-panel p-5 shadow-theme-soft'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-xs uppercase tracking-[0.28em] text-theme-soft'>Exploration identity</p>
          <h2 className='mt-2 text-2xl font-semibold text-theme-text'>My Knowledge Map</h2>
        </div>
        <div className='flex gap-2'>
          <button className='rounded-full border border-theme-border px-3 py-1.5 text-sm text-theme-text' onClick={startFreeJourney}>Free Explore</button>
          <button className='rounded-full bg-theme-primary px-3 py-1.5 text-sm font-semibold text-theme-bg' onClick={startChallengeJourney}>Challenge Mode</button>
        </div>
      </div>

      <div className='grid gap-3 md:grid-cols-4'>
        <div className='rounded-2xl border border-theme-border bg-theme-subcard p-3'>Visited: {metrics?.uniqueNodesVisited ?? 0}</div>
        <div className='rounded-2xl border border-theme-border bg-theme-subcard p-3'>Longest path: {metrics?.longestTraversalPath ?? 0}</div>
        <div className='rounded-2xl border border-theme-border bg-theme-subcard p-3'>Domains: {metrics?.domainsCovered.length ?? 0}</div>
        <div className='rounded-2xl border border-theme-border bg-theme-subcard p-3'>Streak: {streak.currentStreak} days</div>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <article className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
          <h3 className='text-sm font-semibold uppercase tracking-[0.2em] text-theme-soft'>Curiosity intelligence</h3>
          <p className='mt-2 text-sm text-theme-muted'>Trending paths and rare discoveries based on anonymized traversal weights.</p>
          <ul className='mt-3 space-y-1 text-sm text-theme-text'>
            {trendingPaths.map((edge) => (
              <li key={`${edge.source}-${edge.target}`}>{edge.source} → {edge.target} ({edge.weight})</li>
            ))}
          </ul>
          <p className='mt-3 text-xs text-theme-soft'>Rare paths: {rarePaths.map((edge) => `${edge.source}→${edge.target}`).join(', ') || 'Not enough data yet.'}</p>
        </article>

        <article className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
          <h3 className='text-sm font-semibold uppercase tracking-[0.2em] text-theme-soft'>Leaderboard</h3>
          <p className='mt-2 text-sm text-theme-muted'>Global rankings: weekly exploration depth, diversity, and rare-path discovery.</p>
          <ul className='mt-3 space-y-1 text-sm text-theme-text'>
            {topJourneys.map((entry, index) => (
              <li key={entry.id}>#{index + 1} {entry.alias} — score {entry.score}</li>
            ))}
          </ul>
          {metrics ? <p className='mt-2 text-xs text-theme-soft'>Personal rank percentile: Top {100 - getPercentile(snapshot?.journeys ?? [], scoreJourney(activeJourney!))}%</p> : null}
        </article>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <article className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
          <h3 className='text-sm font-semibold uppercase tracking-[0.2em] text-theme-soft'>Achievements</h3>
          <ul className='mt-3 space-y-1 text-sm'>
            {achievements.map((achievement) => (
              <li key={achievement.id} className={achievement.unlocked ? 'text-theme-primary' : 'text-theme-muted'}>{achievement.unlocked ? '✓' : '○'} {achievement.title}</li>
            ))}
          </ul>
        </article>

        <article className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
          <h3 className='text-sm font-semibold uppercase tracking-[0.2em] text-theme-soft'>Share my journey</h3>
          <p className='mt-2 text-sm text-theme-muted'>Generate an image card + copy summary for X/LinkedIn/Instagram.</p>
          <div className='mt-3 flex gap-2'>
            <button className='rounded-full border border-theme-border px-3 py-1 text-sm text-theme-text' onClick={shareJourney}>Copy Summary</button>
            <button className='rounded-full border border-theme-border px-3 py-1 text-sm text-theme-text' onClick={downloadCard}>Download Card</button>
            <button className='rounded-full border border-theme-border px-3 py-1 text-sm text-theme-text' onClick={replayJourney}>5-10s Replay</button>
          </div>
        </article>

        <article className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
          <h3 className='text-sm font-semibold uppercase tracking-[0.2em] text-theme-soft'>Multiplayer room</h3>
          <p className='mt-2 text-sm text-theme-muted'>Real-time collaboration via shared room channel.</p>
          <input value={roomId} onChange={(event) => setRoomId(event.target.value)} className='mt-2 w-full rounded-lg border border-theme-border bg-theme-panel px-2 py-1 text-sm text-theme-text' />
          <p className='mt-2 text-xs text-theme-soft'>Live explorers in room: {liveMembers}</p>
        </article>
      </div>

      <article className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
        <h3 className='text-sm font-semibold uppercase tracking-[0.2em] text-theme-soft'>Discovery feed</h3>
        <p className='mt-2 text-sm text-theme-muted'>Trending journeys, weirdest paths, and efficient exploration shortcuts.</p>
        <div className='mt-3 flex flex-wrap gap-2'>
          {journeys.slice(0, 4).map((journey) => (
            <button key={journey.id} className='rounded-full border border-theme-border px-3 py-1 text-xs text-theme-text' onClick={() => setActiveJourney(journey)}>
              Follow: {journey.name}
            </button>
          ))}
        </div>
        {dailyChallenge ? <p className='mt-3 text-xs text-theme-soft'>Daily challenge: start at {dailyChallenge.start.label}, reach {dailyChallenge.target.label}.</p> : null}
      </article>
    </section>
  );
}
