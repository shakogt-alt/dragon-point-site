import { NextResponse } from 'next/server';
import { getSeoConfig } from './lib/seo/config';

export function proxy() {
  const response = NextResponse.next();
  if (!getSeoConfig().indexable) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
