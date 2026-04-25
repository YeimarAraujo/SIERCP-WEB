import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/favicon', '/home', '/courses', '/history', '/device', '/profile', '/session'];
const ADMIN_PATHS = ['/admin'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow all static assets and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Allow public routes
    if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/') || pathname.startsWith('/' + path))) {
        return NextResponse.next();
    }

    // For development: allow all routes
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};