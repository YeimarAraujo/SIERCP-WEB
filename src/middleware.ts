import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge middleware — defensa en profundidad.
 *
 * Las rutas /api/debug/* son herramientas de diagnóstico que NUNCA deben
 * existir en producción. Cada ruta ya tiene su propio guard `NODE_ENV` +
 * withAuth(['SUPER_ADMIN']), pero este middleware las bloquea antes de que el
 * handler se ejecute, devolviendo 404 en producción (el comportamiento que los
 * comentarios de esas rutas ya prometían).
 */
export function middleware(req: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    req.nextUrl.pathname.startsWith('/api/debug')
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/debug/:path*'],
};
