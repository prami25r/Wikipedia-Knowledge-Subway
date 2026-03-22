import http from 'node:http';
import { URL } from 'node:url';
import { createAppContext } from './api/context.js';
import { exportGraphJsonHandler, exportStationsCsvHandler } from './api/export.js';
import { getGraphHandler } from './api/graph.js';
import { neighborsHandler } from './api/neighbors.js';
import { routeHandler } from './api/route.js';
import { searchHandler } from './api/search.js';
import { stationHandler } from './api/station.js';
import { statsHandler } from './api/stats.js';
import { ApiError, toErrorResponse } from './middleware/errorHandler.js';
import { checkRateLimit } from './middleware/rateLimiter.js';

const PORT = Number(process.env.PORT ?? 4000);
const context = createAppContext();

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    // eslint-disable-next-line no-console
    console.log(`[request] ${req.method} ${pathname}`);

    const clientId = req.socket.remoteAddress ?? 'unknown';

    if (!checkRateLimit(clientId)) {
      throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please retry later.');
    }

    if (req.method !== 'GET') {
      throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Only GET endpoints are exposed.');
    }

    if (pathname === '/health') return sendJson(res, 200, { status: 'ok' });

    // Legacy /api endpoints
    if (pathname === '/api/graph') return sendJson(res, 200, getGraphHandler(context));
    if (pathname === '/api/search') return sendJson(res, 200, searchHandler(context, Object.fromEntries(url.searchParams.entries())));
    if (pathname === '/api/route') return sendJson(res, 200, routeHandler(context, Object.fromEntries(url.searchParams.entries())));
    if (pathname === '/api/stats') return sendJson(res, 200, statsHandler(context));
    if (pathname === '/api/export/graph.json') return sendJson(res, 200, exportGraphJsonHandler(context));
    if (pathname === '/api/export/stations.csv') {
      res.writeHead(200, { 'Content-Type': 'text/csv' });
      return res.end(exportStationsCsvHandler(context));
    }

    if (pathname.startsWith('/api/station/')) {
      const id = decodeURIComponent(pathname.split('/').pop() || '');
      if (!id.trim()) throw new ApiError(400, 'INVALID_PARAMS', 'Station id must not be empty.');
      return sendJson(res, 200, await stationHandler(context, { id }));
    }

    if (pathname.startsWith('/api/neighbors/')) {
      const id = decodeURIComponent(pathname.split('/').pop() || '');
      if (!id.trim()) throw new ApiError(400, 'INVALID_PARAMS', 'Node id must not be empty.');
      return sendJson(res, 200, neighborsHandler(context, { id }));
    }

    // Versioned production endpoints
    if (pathname === '/v1/graph') return sendJson(res, 200, context.pipelineService.getGraph());
    if (pathname === '/v1/subway') return sendJson(res, 200, context.pipelineService.getSubway());
    if (pathname === '/v1/layout') return sendJson(res, 200, context.pipelineService.getLayout());
    if (pathname.startsWith('/v1/explore')) {
      const focus = String(url.searchParams.get('focus') ?? '').trim();
      if (!focus) throw new ApiError(400, 'INVALID_QUERY', 'focus query is required');
      return sendJson(res, 200, context.pipelineService.explore(focus));
    }

    throw new ApiError(404, 'NOT_FOUND', `Route not found: ${pathname}`);
  } catch (err) {
    const response = toErrorResponse(err);
    sendJson(res, response.status, response.body);
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${PORT}`);
});
