import { NextResponse } from 'next/server';

// This route is kept for debugging purposes only.
// It fetches the backend OpenAPI spec and returns auth-related paths.
export async function GET() {
  try {
    const res = await fetch('https://mindcast-backend.onrender.com/openapi.json', {
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Backend returned ${res.status}` }, { status: res.status });
    }
    const spec = await res.json();
    const paths = spec.paths || {};
    const allPaths = Object.keys(paths);
    const authPaths: Record<string, unknown> = {};
    for (const [path, methods] of Object.entries(paths)) {
      if (
        path.toLowerCase().includes('auth') ||
        path.toLowerCase().includes('user') ||
        path.toLowerCase().includes('login') ||
        path.toLowerCase().includes('register') ||
        path.toLowerCase().includes('token') ||
        path.toLowerCase().includes('signup') ||
        path === '/me'
      ) {
        authPaths[path] = methods;
      }
    }
    return NextResponse.json({ allPaths, authPaths, info: spec.info });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
