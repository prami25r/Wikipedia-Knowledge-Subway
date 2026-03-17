import type { AppContext } from './context.js';

export function exportGraphJsonHandler(context: AppContext) {
  return context.graphService.getGraph();
}

export function exportStationsCsvHandler(context: AppContext): string {
  const rows = context.graphService.getGraph().nodes;
  const header = 'id,label,cluster,degree,x,y';
  const body = rows
    .map((row) => `${escapeCsv(row.id)},${escapeCsv(row.label)},${escapeCsv(row.cluster)},${row.degree},${row.x},${row.y}`)
    .join('\n');

  return `${header}\n${body}`;
}

function escapeCsv(value: string): string {
  const sanitized = value.replaceAll('"', '""');
  return `"${sanitized}"`;
}
