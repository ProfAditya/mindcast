import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://mindcast-backend.onrender.com/api'
).replace(/\/+$/, '');

// Ensure the base ends with /api
const BACKEND_URL = BACKEND_BASE.endsWith('/api')
  ? BACKEND_BASE
  : `${BACKEND_BASE}/api`;

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const backendPath = '/' + path.join('/');

  // Forward query string
  const { searchParams } = req.nextUrl;
  const queryString = searchParams.toString();
  const targetUrl = `${BACKEND_URL}${backendPath}${queryString ? `?${queryString}` : ''}`;

  // Build forwarded headers — pass Authorization if present, always set Content-Type
  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const auth = req.headers.get('authorization');
  if (auth) forwardHeaders['Authorization'] = auth;

  // Read body for mutating methods
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    try {
      body = await req.text();
    } catch {
      body = undefined;
    }
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body || undefined,
      // @ts-expect-error — Node 18+ fetch supports this
      duplex: 'half',
    });
  } catch (err) {
    console.error('[proxy] Backend unreachable:', err);
    return NextResponse.json(
      { detail: 'Backend server is unreachable. Please try again later.' },
      { status: 503 }
    );
  }

  // Stream the response body back
  const responseBody = await backendRes.text();

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: {
      'Content-Type': backendRes.headers.get('content-type') || 'application/json',
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
