import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKnowledgeGraph } from '../../../../packages/graph-core/src/index.js';
import { toSubwayMap } from '../../../../packages/subway-engine/src/index.js';
import { computeDeterministicGridLayout } from '../../../../packages/layout-engine/src/index.js';
import type { ExploreResponse, KnowledgeGraph, LayoutMap, SubwayMap } from '../../../../packages/shared-types/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PipelineService {
  private graphCache?: KnowledgeGraph;
  private subwayCache?: SubwayMap;
  private layoutCache?: LayoutMap;

  private loadRawNodes(): Array<{ id: string; title: string; category: string }> {
    const articlesPath = path.resolve(__dirname, '../../data/articles.json');
    const raw = JSON.parse(fs.readFileSync(articlesPath, 'utf8')) as { nodes: Array<{ id: string; line?: string }> };
    return (raw.nodes ?? []).map((node) => ({ id: node.id, title: node.id, category: node.line ?? 'uncategorized' }));
  }

  private loadRawEdges(): Array<{ source: string; target: string }> {
    const graphPath = path.resolve(__dirname, '../../data/graph.json');
    const raw = JSON.parse(fs.readFileSync(graphPath, 'utf8')) as { edges: Array<{ source: string; target: string }> };
    return raw.edges ?? [];
  }

  getGraph(): KnowledgeGraph {
    if (!this.graphCache) {
      this.graphCache = buildKnowledgeGraph(this.loadRawNodes(), this.loadRawEdges(), 'v1');
    }
    return this.graphCache as KnowledgeGraph;
  }

  getSubway(): SubwayMap {
    if (!this.subwayCache) {
      this.subwayCache = toSubwayMap(this.getGraph());
    }
    return this.subwayCache;
  }

  getLayout(): LayoutMap {
    if (!this.layoutCache) {
      this.layoutCache = computeDeterministicGridLayout(this.getSubway());
    }
    return this.layoutCache;
  }

  explore(focus: string): ExploreResponse {
    const graph = this.getGraph();
    const neighbors = graph.edges
      .filter((edge) => edge.source === focus || edge.target === focus)
      .map((edge) => (edge.source === focus ? edge.target : edge.source))
      .slice(0, 25);

    const recommendedStations = graph.nodes
      .slice()
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 10)
      .map((node) => node.id);

    return {
      focus,
      neighbors,
      recommendedStations,
      suggestedPaths: neighbors.slice(0, 3).map((neighbor) => [focus, neighbor]),
    };
  }
}
