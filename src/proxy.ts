import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory global rate limit (defense-in-depth; per-endpoint limits are in Firestore)
const rateLimitMap = new Map<string, [number, number]>();
const RATE_LIMIT_WINDOW = 60 * 1_000; // 1 min
const MAX_REQUESTS      = 60;         // per IP per window

// Paths whose Content-Type is not expected to be application/json
const CONTENT_TYPE_EXEMPT = ['/api/wompi-webhook', '/api/upload'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── 1. Request-ID for distributed tracing ────────────────────────────────
  response.headers.set('X-Request-ID', crypto.randomUUID());

  // ── 2. Block debug endpoints in production ────────────────────────────────
  if (pathname.startsWith('/api/debug') && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // ── 3. IP extraction — Cloudflare header takes priority ──────────────────
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // ── 4. Global rate limiting (in-memory, 60 req/min per IP) ───────────────
  const now      = Date.now();
  const existing = rateLimitMap.get(ip);
  if (existing) {
    const [ts, count] = existing;
    if (now - ts < RATE_LIMIT_WINDOW) {
      if (count >= MAX_REQUESTS) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
      rateLimitMap.set(ip, [ts, count + 1]);
    } else {
      rateLimitMap.set(ip, [now, 1]);
    }
  } else {
    rateLimitMap.set(ip, [now, 1]);
  }
  // Evict stale entries to keep map bounded
  if (rateLimitMap.size > 1_000) {
    for (const [key, [ts]] of rateLimitMap.entries()) {
      if (now - ts > RATE_LIMIT_WINDOW) rateLimitMap.delete(key);
    }
  }

  // ── 5. Enforce JSON Content-Type on mutating API requests ─────────────────
  const isApi      = pathname.startsWith('/api/');
  const isMutating = request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH';
  const isExempt   = CONTENT_TYPE_EXEMPT.some(p => pathname.startsWith(p));

  if (isApi && isMutating && !isExempt) {
    const ct = request.headers.get('Content-Type') ?? '';
    if (ct && !ct.includes('application/json') && !ct.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type debe ser application/json' },
        { status: 415 },
      );
    }
  }

  // ── 6. Session-based route protection (Firebase session cookie) ──────────
  const session = request.cookies.get('session')?.value;
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/home') ||
    pathname.startsWith('/super-admin');

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 7. CORS — restrict to own origin in production ────────────────────────
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? '*';
  const origin        = request.headers.get('origin');
  if (origin && (allowedOrigin === '*' || origin === allowedOrigin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // ── 8. Security headers ───────────────────────────────────────────────────
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cache control only for API responses — do not break Next.js static caching
  if (isApi) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/home/:path*',
    '/courses/:path*',
    '/courses',
    '/session/:path*',
    '/live/:path*',
    '/history',
    '/history/:path*',
    '/device',
    '/device/:path*',
    '/profile',
    '/profile/:path*',
    '/admin',
    '/admin/:path*',
    '/super-admin',
    '/super-admin/:path*',
    '/instructor',
    '/instructor/:path*',
  ],
};
