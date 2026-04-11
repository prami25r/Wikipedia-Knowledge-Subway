'use client';

import { useSyncExternalStore } from 'react';
import { trackNodeVisit } from '@/lib/journey-engine';
import type { BackendGraphResponse, BackendLineSummary, BackendStationResponse, BackendStatsResponse } from '@/types/backend';

type SubwayState = {
  graph: BackendGraphResponse | null;
  stats: BackendStatsResponse | null;
  lines: BackendLineSummary[];
  activeLineId: string | null;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  routeStart: string | null;
  routeEnd: string | null;
  routePath: string[];
  station: BackendStationResponse | null;
};

const store = {
  state: {
    graph: null,
    stats: null,
    lines: [],
    activeLineId: null,
    selectedNodeId: null,
    hoveredNodeId: null,
    routeStart: null,
    routeEnd: null,
    routePath: [],
    station: null,
  } as SubwayState,
  listeners: new Set<() => void>(),
};

function setState(updates: Partial<SubwayState>): void {
  store.state = { ...store.state, ...updates };
  for (const listener of store.listeners) listener();
}

function subscribe(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

export function useSubwayStore<T>(selector: (state: SubwayState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(store.state), () => selector(store.state));
}

export const subwayActions = {
  setGraph(graph: BackendGraphResponse) {
    const defaultNode = graph.nodes[0]?.id ?? null;
    setState({
      graph,
      selectedNodeId: store.state.selectedNodeId ?? defaultNode,
      routeStart: store.state.routeStart ?? defaultNode,
      routeEnd: store.state.routeEnd ?? graph.nodes[1]?.id ?? defaultNode,
    });
  },
  setStats(stats: BackendStatsResponse) {
    setState({ stats });
  },
  setLines(lines: BackendLineSummary[]) {
    setState({ lines });
  },
  setActiveLine(activeLineId: string | null) {
    setState({ activeLineId });
  },
  selectNode(nodeId: string | null) {
    setState({ selectedNodeId: nodeId, station: null });
    if (!nodeId || !store.state.graph) return;
    const node = store.state.graph.nodes.find((entry) => entry.id === nodeId);
    if (node) {
      trackNodeVisit(node);
    }
  },
  hoverNode(nodeId: string | null) {
    setState({ hoveredNodeId: nodeId });
  },
  setRouteEndpoints(routeStart: string | null, routeEnd: string | null) {
    setState({ routeStart, routeEnd });
  },
  setRoutePath(routePath: string[]) {
    setState({ routePath });
  },
  setStation(station: BackendStationResponse | null) {
    setState({ station });
  },
};
