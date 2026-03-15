export type PathEdge = {
  source: string;
  target: string;
};

function buildAdjacency(edges: PathEdge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, new Set());
    }
    if (!adjacency.has(edge.target)) {
      adjacency.set(edge.target, new Set());
    }

    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  return adjacency;
}

export function findShortestPath(start: string, end: string, edges: PathEdge[]): string[] {
  if (!start || !end) {
    return [];
  }

  if (start === end) {
    return [start];
  }

  const adjacency = buildAdjacency(edges);
  if (!adjacency.has(start) || !adjacency.has(end)) {
    return [];
  }

  const visited = new Set<string>([start]);
  const queue: string[] = [start];
  const previous = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const neighbors = adjacency.get(current);
    if (!neighbors) continue;

    for (const next of neighbors) {
      if (visited.has(next)) {
        continue;
      }

      visited.add(next);
      previous.set(next, current);

      if (next === end) {
        const path: string[] = [end];
        let cursor = end;

        while (cursor !== start) {
          const parent = previous.get(cursor);
          if (!parent) {
            return [];
          }
          path.push(parent);
          cursor = parent;
        }

        return path.reverse();
      }

      queue.push(next);
    }
  }

  return [];
}

export function buildPathEdgeKeySet(path: string[]): Set<string> {
  const keys = new Set<string>();

  for (let index = 0; index < path.length - 1; index += 1) {
    const source = path[index];
    const target = path[index + 1];
    const key = source < target ? `${source}::${target}` : `${target}::${source}`;
    keys.add(key);
  }

  return keys;
}
