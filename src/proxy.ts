import { NextResponse, type NextRequest } from 'next/server';
import { getSeoConfig } from './lib/seo/config';

export function proxy(request: NextRequest) {
  let response: NextResponse;
  try {
    // Invalid encoded path segments must not reach the locale/router decoder.
    // Inspect the path only; campaign/query capture and cleanup are unchanged.
    decodeURIComponent(request.nextUrl.pathname);
    response = NextResponse.next();
  } catch {
    response = new NextResponse(null, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (!getSeoConfig().indexable) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
