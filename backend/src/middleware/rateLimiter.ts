interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(clientId: string, limit = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  const current = buckets.get(clientId);

  if (!current || current.resetAt <= now) {
    buckets.set(clientId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}
