import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
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
