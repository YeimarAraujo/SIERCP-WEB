/**
 * POST /api/people
 *
 *   { action: 'lookup', identification?: string, email?: string }
 *     Personal (admin, instructor o dueño de un curso) busca a una persona para
 *     inscribirla. Devuelve solo nombre, correo, rol y cédula.
 *
 *   { action: 'batch', ids: string[] }
 *     Perfiles mínimos de las personas con las que el usuario tiene relación.
 *
 * Cada búsqueda queda en audit_logs y tiene límite de uso (Ley 1581: acceso
 * restringido y responsabilidad demostrada).
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp, rateLimiter } from '@/lib/rate-limiter';
import { canLookUp, findPerson, MAX_BATCH, normalizeEmail, normalizeIdentification, visibleProfiles } from '@/lib/people';

export async function POST(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const viewer = { uid: auth.uid, role: auth.role, institutionId: auth.institutionId };

  if (body.action === 'batch') {
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
    if (ids.length === 0 || ids.length > MAX_BATCH) {
      return NextResponse.json({ error: `Envía entre 1 y ${MAX_BATCH} identificadores.` }, { status: 400 });
    }
    const people = await visibleProfiles(adminDb, viewer, ids);
    return NextResponse.json({ people });
  }

  if (body.action === 'lookup') {
    const identification = normalizeIdentification(body.identification);
    const email = normalizeEmail(body.email);
    if (!identification && !email) {
      return NextResponse.json({ error: 'Escribe una cédula o un correo válido.' }, { status: 400 });
    }

    const limit = await rateLimiter.check(`people-lookup:${auth.uid}`, { max: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Demasiadas búsquedas. Espera un minuto.' }, { status: 429 });
    }
    if (!(await canLookUp(adminDb, viewer))) {
      return NextResponse.json({ error: 'Solo el personal de un curso o institución puede buscar personas.' }, { status: 403 });
    }

    const person = await findPerson(adminDb, { identification, email });
    await auditLog({
      type: 'person_lookup',
      userId: auth.uid,
      metadata: { by: identification ? 'identification' : 'email', found: person !== null, targetUid: person?.uid ?? null },
      severity: 'INFO',
      ip: getClientIp(req),
    });
    return NextResponse.json({ person });
  }

  return NextResponse.json({ error: 'Acción desconocida.' }, { status: 400 });
}
