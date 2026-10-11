export const dynamic = 'force-dynamic';

// No approved icon master exists yet. Avoid a browser 404 without inventing art.
// Replace this route with the approved favicon asset when the owner supplies it.
export function GET() {
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
