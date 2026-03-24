import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BACKEND_ORIGIN = 'http://127.0.0.1:4000';

function getBackendOrigin(): string {
  return (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_ORIGIN).replace(/\/$/, '');
}

function getForwardHeaders(headers: Headers): Headers {
  const forwarded = new Headers();
  const contentType = headers.get('content-type');
  const cacheControl = headers.get('cache-control');

  if (contentType) {
    forwarded.set('content-type', contentType);
  }

  if (cacheControl) {
    forwarded.set('cache-control', cacheControl);
  }

  return forwarded;
}

export async function proxyBackendGet(request: NextRequest, path: string): Promise<NextResponse> {
  const targetUrl = new URL(`${getBackendOrigin()}${path}`);
  targetUrl.search = request.nextUrl.search;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: request.headers.get('accept') ?? 'application/json',
      },
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: getForwardHeaders(response.headers),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to reach backend service.',
      },
      { status: 502 },
    );
  }
}
