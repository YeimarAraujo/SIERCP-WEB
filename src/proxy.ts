import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map
// Key: IP address, Value: [timestamp, count]
const rateLimitMap = new Map<string, [number, number]>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export function proxy(request: NextRequest) {
    const response = NextResponse.next();
    
    // --- 1. Obtener IP segura detrás de proxies ---
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

    // --- 2. Rate Limiting ---
    const now = Date.now();
    const userData = rateLimitMap.get(ip);

    if (userData) {
        const [timestamp, count] = userData;
        if (now - timestamp < RATE_LIMIT_WINDOW) {
            if (count >= MAX_REQUESTS) {
                return new NextResponse('Too Many Requests', { status: 429 });
            }
            rateLimitMap.set(ip, [timestamp, count + 1]);
        } else {
            rateLimitMap.set(ip, [now, 1]);
        }
    } else {
        rateLimitMap.set(ip, [now, 1]);
    }

    // Limpieza de caché de rate limit
    if (rateLimitMap.size > 1000) {
        for (const [key, [timestamp]] of rateLimitMap.entries()) {
            if (now - timestamp > RATE_LIMIT_WINDOW) {
                rateLimitMap.delete(key);
            }
        }
    }

    // --- 3. Protección de rutas (Auth Check) ---
    const session = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    // Rutas que requieren autenticación
    const isProtectedRoute = 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/instructor') || 
        pathname.startsWith('/profile') ||
        pathname.startsWith('/home');

    if (isProtectedRoute && !session) {
        const loginUrl = new URL('/login', request.url);
        // Guardar la URL original para volver después del login
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // --- 4. CORS Configuration ---
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    const origin = request.headers.get('origin');
    if (origin && (allowedOrigin === '*' || allowedOrigin === origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // --- 4. Cache Control (Anti-BFcache) ---
    response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Vary', '*');

    // --- 5. Security Headers ---
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

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
