import type { AppContext } from './context.js';
import { ApiError } from '../middleware/errorHandler.js';
import { searchQuerySchema } from './validators.js';

export function searchHandler(context: AppContext, query: Record<string, unknown>) {
  const parsed = searchQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_QUERY', 'Invalid search query', parsed.error.flatten());
  }

  const { q, limit } = parsed.data;
  return { results: context.searchService.search(q, limit) };
}
