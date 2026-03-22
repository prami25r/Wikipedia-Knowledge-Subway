export function normalizeNodeId(input: string): string {
  return input.trim().replace(/[\s-]+/g, '_').replace(/_+/g, '_').toLowerCase();
}
