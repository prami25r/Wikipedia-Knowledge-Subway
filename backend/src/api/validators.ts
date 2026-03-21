import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().min(1).max(200),
});

export const stationIdParamSchema = z.object({
  id: z.string().min(1).max(200),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const routeQuerySchema = z.object({
  start: z.string().min(1).max(200),
  end: z.string().min(1).max(200),
});
