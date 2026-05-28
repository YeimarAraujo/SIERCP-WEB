import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    const { allowed } = await rateLimiter.check(`auth-session:${ip}`, { max: 10, windowMs: 60_000 });
    if (!allowed) {
        return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 });
    }

    try {
        const { idToken } = await req.json();
        if (!idToken) return NextResponse.json({ error: 'ID Token requerido' }, { status: 400 });

        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const response = NextResponse.json({ success: true });
        response.cookies.set('session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'strict',
        });
        return response;
    } catch (error) {
        console.error('Error al crear sesión:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', { maxAge: 0, path: '/' });
    return response;
}