import Graph from 'graphology';
import { shortestPath } from '../graph/graphUtils.js';

export class RouteService {
  constructor(private readonly graph: Graph) {}

  shortestPath(start: string, end: string): { path: string[]; distance: number } {
    const path = shortestPath(this.graph, start, end);
    return {
      path,
      distance: path.length > 0 ? path.length - 1 : -1,
    };
  }
}
