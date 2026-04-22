import http from 'node:http';
import { URL } from 'node:url';
import { createAppContext } from './api/context.js';
import { exportGraphJsonHandler, exportStationsCsvHandler } from './api/export.js';
import { getGraphHandler } from './api/graph.js';
import { lineHandler } from './api/line.js';
import { linesHandler } from './api/lines.js';
import { neighborsHandler } from './api/neighbors.js';
import { routeHandler } from './api/route.js';
import { searchHandler } from './api/search.js';
import { stationHandler } from './api/station.js';
import { statsHandler } from './api/stats.js';
import { ApiError, toErrorResponse } from './middleware/errorHandler.js';
import { checkRateLimit } from './middleware/rateLimiter.js';

const DEFAULT_PORT = 4000;
const PORT_RETRY_LIMIT = 10;

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    // eslint-disable-next-line no-console
    console.error(`[server] Invalid PORT "${value}". Expected an integer from 1 to 65535.`);
    process.exit(1);
  }

  return port;
}

function isSystemError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

const initialPort = parsePort(process.env.PORT);
const shouldTryAlternatePorts = process.env.PORT === undefined;
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

    // Static routes first
    if (pathname === '/api/graph') return sendJson(res, 200, getGraphHandler(context));
    if (pathname === '/api/lines') return sendJson(res, 200, linesHandler(context));
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
      if (!id.trim()) {
        throw new ApiError(400, 'INVALID_PARAMS', 'Station id must not be empty.');
      }
      return sendJson(res, 200, await stationHandler(context, { id }));
    }

    if (pathname.startsWith('/api/line/')) {
      const cluster = decodeURIComponent(pathname.split('/').pop() || '');
      if (!cluster.trim()) {
        throw new ApiError(400, 'INVALID_PARAMS', 'Line id must not be empty.');
      }
      return sendJson(res, 200, lineHandler(context, { cluster }));
    }

    if (pathname.startsWith('/api/neighbors/')) {
      const id = decodeURIComponent(pathname.split('/').pop() || '');
      if (!id.trim()) {
        throw new ApiError(400, 'INVALID_PARAMS', 'Node id must not be empty.');
      }
      return sendJson(res, 200, neighborsHandler(context, { id }));
    }

    throw new ApiError(404, 'NOT_FOUND', `Route not found: ${pathname}`);
  } catch (err) {
    const response = toErrorResponse(err);
    sendJson(res, response.status, response.body);
  }
});

server.on('listening', () => {
  const address = server.address();
  const activePort = typeof address === 'object' && address !== null ? address.port : initialPort;

  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${activePort}`);

  if (activePort !== initialPort) {
    // eslint-disable-next-line no-console
    console.warn(
      `[server] Frontend defaults to http://127.0.0.1:${initialPort}; set NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:${activePort} if you want it to use this backend.`,
    );
  }
});

function listen(port: number, retriesLeft: number): void {
  server.once('error', (error) => {
    if (isSystemError(error) && error.code === 'EADDRINUSE') {
      const nextPort = port + 1;

      if (shouldTryAlternatePorts && retriesLeft > 0 && nextPort <= 65535) {
        // eslint-disable-next-line no-console
        console.warn(`[server] Port ${port} is already in use; trying ${nextPort}.`);
        listen(nextPort, retriesLeft - 1);
        return;
      }

      // eslint-disable-next-line no-console
      console.error(`[server] Port ${port} is already in use.`);
      // eslint-disable-next-line no-console
      console.error('[server] Stop the process using it, or set PORT to another value before running npm run dev.');
      process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.error('[server] Failed to start backend:', error);
    process.exit(1);
  });

  server.listen(port);
}

listen(initialPort, PORT_RETRY_LIMIT);
