import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const response = NextResponse.next();

    // Headers que deshabilitan bfcache a nivel HTTP
    // Esto es más confiable que cualquier fix de JS en React
    response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    // Vary header previene que proxies cacheen la respuesta
    response.headers.set('Vary', '*');

    return response;
}

export const config = {
    matcher: [
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
