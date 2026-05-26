/**
 * withAuth — Universal auth middleware for API routes.
 *
 * Usage:
 *   const auth = await withAuth(req, ['ADMIN', 'SUPER_ADMIN']);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.uid, auth.role, auth.institutionId are available
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INSTRUCTOR'
  | 'USUARIO_SST'
  | 'USUARIO_PROFESIONAL'
  | 'USUARIO';

export interface AuthContext {
  uid: string;
  role: UserRole;
  institutionId?: string;
  email: string;
}

/**
 * Verifies the Bearer token in the Authorization header.
 * Looks up the user's role and active status in Firestore.
 * Returns AuthContext on success or a NextResponse error on failure.
 *
 * @param req - Incoming NextRequest
 * @param requiredRoles - If provided, user must have one of these roles
 */
export async function withAuth(
  req: NextRequest,
  requiredRoles?: UserRole[],
): Promise<AuthContext | NextResponse> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'No autorizado. Token requerido.' },
      { status: 401 },
    );
  }

  const idToken = authHeader.slice(7);

  let decodedToken: { uid: string; email?: string; isSuperAdmin?: boolean };
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: 'Token inválido o expirado.' },
      { status: 401 },
    );
  }

  // Fast path: custom claim present → skip Firestore lookup entirely.
  // The claim is cryptographically signed in the JWT; no Firestore read needed.
  if (decodedToken.isSuperAdmin === true) {
    if (requiredRoles && !requiredRoles.includes('SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Acceso denegado. Permisos insuficientes.' },
        { status: 403 },
      );
    }
    return {
      uid:   decodedToken.uid,
      role:  'SUPER_ADMIN',
      email: decodedToken.email ?? '',
    };
  }

  const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
  if (!userDoc.exists) {
    return NextResponse.json(
      { error: 'Usuario no encontrado.' },
      { status: 401 },
    );
  }

  const userData = userDoc.data()!;

  if (userData.isActive === false) {
    return NextResponse.json(
      { error: 'Cuenta desactivada. Contacta al administrador.' },
      { status: 403 },
    );
  }

  const role = userData.role as UserRole;

  if (requiredRoles && !requiredRoles.includes(role)) {
    return NextResponse.json(
      { error: 'Acceso denegado. Permisos insuficientes.' },
      { status: 403 },
    );
  }

  return {
    uid: decodedToken.uid,
    role,
    institutionId: userData.institutionId ?? undefined,
    email: userData.email ?? '',
  };
}

/** Returns true if the auth context has one of the given roles. */
export function hasRole(auth: AuthContext, roles: UserRole[]): boolean {
  return roles.includes(auth.role);
}

/** Returns true if this is a SUPER_ADMIN. */
export function isSuperAdmin(auth: AuthContext): boolean {
  return auth.role === 'SUPER_ADMIN';
}

/** Returns true if this is an ADMIN or SUPER_ADMIN. */
export function isAdmin(auth: AuthContext): boolean {
  return auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN';
}
