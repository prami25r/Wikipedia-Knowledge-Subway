import Fuse from 'fuse.js';
import type { NodeRecord } from '../types/graph.js';

interface SearchIndexRecord {
  id: string;
  title: string;
  cluster: string;
  degree: number;
}

export class SearchService {
  private fuse: Fuse<SearchIndexRecord>;

  constructor(nodes: NodeRecord[]) {
    const indexData: SearchIndexRecord[] = nodes.map((node) => ({
      id: node.id,
      title: node.label,
      cluster: node.cluster,
      degree: node.degree,
    }));

    this.fuse = new Fuse(indexData, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: ['title', 'cluster'],
    });
  }

  search(query: string, limit = 20): SearchIndexRecord[] {
    const trimmed = query.trim();
    if (!trimmed) return [];

    return this.fuse
      .search(trimmed)
      .slice(0, limit)
      .map((result) => result.item);
  }
}
