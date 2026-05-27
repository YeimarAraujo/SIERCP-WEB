import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';

/**
 * Endpoint API para persistencia de registros de auditoría.
 *
 * MOTIVACIÓN:
 * El AuditService del cliente reportaba errores de permisos al escribir
 * directamente en Firestore ("Missing or insufficient permissions").
 * Si bien se actualizaron las reglas de seguridad para permitir escritura
 * condicional, esta vía API proporciona mayor robustez y seguridad:
 *
 * 1. Utiliza Admin SDK (bypass de reglas de seguridad), eliminando
 *    dependencia de que las reglas del cliente estén correctamente configuradas.
 * 2. Aplica rate limiting por IP para mitigar posibles abusos.
 * 3. Ejecuta validaciones server-side adicionales (anti-spoofing de actor).
 * 4. El cliente no requiere permisos de escritura directa en Firestore.
 *
 * ESTRATEGIA DE FALLBACK:
 * El AuditService intenta este endpoint como primera opción. Si la llamada
 * falla (red no disponible, token expirado, etc.), realiza fallback a
 * escritura directa vía Firestore SDK con las reglas actualizadas.
 *
 * @requires Authorization: Bearer <Firebase ID Token>
 * @param req.body.actor.uid Debe coincidir con el UID autenticado (anti-spoofing)
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    // ── Rate limiting ───────────────────────────────────────────────────────
    const rl = await rateLimiter.check(`audit:${ip}`, { max: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    // ── Authentication ──────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let decodedToken: { uid: string };
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ── Body validation ───────────────────────────────────────────────────
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    const { actor, action, resource, resourceId, institutionId, metadata, severity } = body;

    if (!actor || typeof actor !== 'object' || !actor.uid) {
      return NextResponse.json({ error: 'actor.uid requerido' }, { status: 400 });
    }

    // Anti-spoofing: el actor.uid debe coincidir con el uid autenticado
    if (actor.uid !== decodedToken.uid) {
      return NextResponse.json({ error: 'Actor no autorizado' }, { status: 403 });
    }

    if (!action || typeof action !== 'string' || action.trim().length === 0) {
      return NextResponse.json({ error: 'action requerido' }, { status: 400 });
    }

    if (!resource || typeof resource !== 'string' || resource.trim().length === 0) {
      return NextResponse.json({ error: 'resource requerido' }, { status: 400 });
    }

    // ── Persist to Firestore ───────────────────────────────────────────────
    await adminDb.collection('auditLogs').add({
      actor: {
        uid: actor.uid,
        email: actor.email ?? null,
        name: actor.name ?? null,
        role: actor.role ?? null,
      },
      action: action.trim(),
      resource: resource.trim(),
      resourceId: resourceId ?? null,
      institutionId: institutionId ?? null,
      metadata: metadata ?? {},
      severity: severity ?? 'info',
      ip: ip ?? null,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[api/audit] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
