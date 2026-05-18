import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * API para obtener el perfil del usuario actual basado en la cookie de sesión.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    /* checkRevoked: true — si la cuenta fue deshabilitada, el token falla */
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json({
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      name: decodedClaims.name || '',
      role: decodedClaims.role || 'ESTUDIANTE', // Asumimos un claim personalizado de rol
    });
  } catch (error) {
    return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
  }
}
