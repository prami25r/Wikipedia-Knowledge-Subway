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
import { toErrorResponse, ApiError } from './middleware/errorHandler.js';
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
    const clientId = req.socket.remoteAddress ?? 'unknown';

    if (!checkRateLimit(clientId)) {
      throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please retry later.');
    }

    if (req.method !== 'GET') {
      throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Only GET endpoints are exposed.');
    }

    if (url.pathname === '/health') return sendJson(res, 200, { status: 'ok' });
    if (url.pathname === '/api/graph') return sendJson(res, 200, getGraphHandler(context));
    if (url.pathname === '/api/search') return sendJson(res, 200, searchHandler(context, Object.fromEntries(url.searchParams.entries())));
    if (url.pathname === '/api/route') return sendJson(res, 200, routeHandler(context, Object.fromEntries(url.searchParams.entries())));
    if (url.pathname === '/api/stats') return sendJson(res, 200, statsHandler(context));
    if (url.pathname === '/api/export/graph.json') return sendJson(res, 200, exportGraphJsonHandler(context));
    if (url.pathname === '/api/export/stations.csv') {
      res.writeHead(200, { 'Content-Type': 'text/csv' });
      return res.end(exportStationsCsvHandler(context));
    }

    if (url.pathname.startsWith('/api/station/')) {
      const id = decodeURIComponent(url.pathname.replace('/api/station/', ''));
      return sendJson(res, 200, await stationHandler(context, { id }));
    }

    if (url.pathname.startsWith('/api/neighbors/')) {
      const id = decodeURIComponent(url.pathname.replace('/api/neighbors/', ''));
      return sendJson(res, 200, neighborsHandler(context, { id }));
    }

    throw new ApiError(404, 'NOT_FOUND', `Route not found: ${url.pathname}`);
  } catch (err) {
    const response = toErrorResponse(err);
    sendJson(res, response.status, response.body);
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${PORT}`);
});
