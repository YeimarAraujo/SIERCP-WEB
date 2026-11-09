/**
 * Centro de privacidad (Ley 1581 de 2012).
 *
 * POST { action: 'consent', policyVersion, marketing, channel, birthDate?, guardian? }
 *   Registra la autorización con fecha, IP y canal. Sin edición posterior.
 * POST { action: 'marketing', enabled }
 *   Cambia la autorización opcional de publicidad (también queda registrada).
 * POST { action: 'request', type, message }
 *   Abre una consulta o reclamo con su fecha límite legal.
 * GET
 *   Descarga los datos personales del usuario en JSON (derecho de acceso).
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp, rateLimiter } from '@/lib/rate-limiter';
import {
  addBusinessDays, ADULT_AGE, ageOn, parseGuardian, PRIVACY_POLICY_VERSION,
  RESPONSE_BUSINESS_DAYS, type PrivacyRequestType,
} from '@/lib/privacy';

const REQUEST_TYPES = Object.keys(RESPONSE_BUSINESS_DAYS) as PrivacyRequestType[];

export async function POST(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const ip = getClientIp(req);
  const userAgent = (req.headers.get('user-agent') ?? '').slice(0, 300);
  const userRef = adminDb.collection('users').doc(auth.uid);

  if (body.action === 'consent') {
    if (body.policyVersion !== PRIVACY_POLICY_VERSION) {
      return NextResponse.json({ error: 'La política cambió. Recarga y léela de nuevo.', policyVersion: PRIVACY_POLICY_VERSION }, { status: 409 });
    }
    const channel = body.channel === 'app' ? 'app' : 'web';
    const marketing = body.marketing === true;

    const user = (await userRef.get()).data() ?? {};
    const birthDate = typeof body.birthDate === 'string' ? body.birthDate : (user.birthDate as string | undefined);
    if (!birthDate) {
      return NextResponse.json({ error: 'Indica tu fecha de nacimiento.' }, { status: 400 });
    }
    const age = ageOn(birthDate, new Date());
    if (age === null) {
      return NextResponse.json({ error: 'La fecha de nacimiento no es válida.' }, { status: 400 });
    }
    const isMinor = age < ADULT_AGE;
    const guardian = isMinor ? parseGuardian(body.guardian) : null;
    if (isMinor && !guardian) {
      return NextResponse.json({ error: 'Para menores de 18 años autoriza su representante legal. Completa sus datos.', needsGuardian: true }, { status: 400 });
    }

    const consent = {
      userId: auth.uid,
      kind: 'policy',
      policyVersion: PRIVACY_POLICY_VERSION,
      purposes: { required: true, marketing },
      channel,
      isMinor,
      guardian,
      ip,
      userAgent,
      acceptedAt: FieldValue.serverTimestamp(),
    };
    const batch = adminDb.batch();
    batch.create(adminDb.collection('consents').doc(), consent);
    batch.set(userRef, {
      birthDate,
      privacy: {
        policyVersion: PRIVACY_POLICY_VERSION,
        acceptedAt: FieldValue.serverTimestamp(),
        marketing,
        isMinor,
        guardianName: guardian?.name ?? null,
      },
    }, { merge: true });
    await batch.commit();

    await auditLog({ type: 'consent_recorded', userId: auth.uid, metadata: { policyVersion: PRIVACY_POLICY_VERSION, marketing, channel, isMinor }, severity: 'INFO', ip });
    return NextResponse.json({ ok: true, policyVersion: PRIVACY_POLICY_VERSION });
  }

  if (body.action === 'marketing') {
    const enabled = body.enabled === true;
    const batch = adminDb.batch();
    batch.create(adminDb.collection('consents').doc(), {
      userId: auth.uid,
      kind: 'marketing',
      policyVersion: PRIVACY_POLICY_VERSION,
      purposes: { marketing: enabled },
      channel: body.channel === 'app' ? 'app' : 'web',
      ip,
      userAgent,
      acceptedAt: FieldValue.serverTimestamp(),
    });
    batch.set(userRef, { privacy: { marketing: enabled } }, { merge: true });
    await batch.commit();
    await auditLog({ type: 'consent_recorded', userId: auth.uid, metadata: { marketing: enabled }, severity: 'INFO', ip });
    return NextResponse.json({ ok: true, marketing: enabled });
  }

  if (body.action === 'request') {
    const type = body.type as PrivacyRequestType;
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
    if (!REQUEST_TYPES.includes(type) || message.length < 10) {
      return NextResponse.json({ error: 'Elige el tipo de solicitud y descríbela (mínimo 10 caracteres).' }, { status: 400 });
    }
    const limit = await rateLimiter.check(`privacy-request:${auth.uid}`, { max: 5, windowMs: 24 * 60 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Ya enviaste varias solicitudes hoy. Te responderemos por correo.' }, { status: 429 });
    }

    const now = new Date();
    const dueAt = addBusinessDays(now, RESPONSE_BUSINESS_DAYS[type]);
    const ref = await adminDb.collection('privacy_requests').add({
      userId: auth.uid,
      email: auth.email,
      type,
      message,
      status: 'open',
      createdAt: Timestamp.fromDate(now),
      dueAt: Timestamp.fromDate(dueAt),
    });
    await auditLog({ type: 'privacy_request', userId: auth.uid, metadata: { requestId: ref.id, type }, severity: 'WARN', ip });
    return NextResponse.json({ ok: true, id: ref.id, dueAt: dueAt.toISOString() });
  }

  return NextResponse.json({ error: 'Acción desconocida.' }, { status: 400 });
}

/** Derecho de acceso: todos los datos personales del usuario en un archivo. */
export async function GET(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth instanceof NextResponse) return auth;

  const limit = await rateLimiter.check(`privacy-export:${auth.uid}`, { max: 3, windowMs: 60 * 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Puedes descargar tus datos hasta 3 veces por hora.' }, { status: 429 });
  }

  const byUser = (collection: string, field = 'userId', max = 500) =>
    adminDb.collection(collection).where(field, '==', auth.uid).limit(max).get()
      .then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      .catch(() => []);

  const [user, memberships, sessions, consents, requests, skills, badges] = await Promise.all([
    adminDb.collection('users').doc(auth.uid).get().then((d) => d.data() ?? {}),
    byUser('memberships'),
    byUser('sessions', 'studentId'),
    byUser('consents'),
    byUser('privacy_requests'),
    byUser('userSkills'),
    byUser('userBadges'),
  ]);

  // Credenciales técnicas: no son datos útiles para el titular y no deben circular.
  const { fcmToken: _fcm, fcmTokens: _tokens, ...profile } = user as Record<string, unknown>;
  void _fcm; void _tokens;

  await auditLog({ type: 'data_export', userId: auth.uid, metadata: { scope: 'self' }, severity: 'INFO', ip: getClientIp(req) });
  return new NextResponse(JSON.stringify({
    exportedAt: new Date().toISOString(),
    policyVersion: PRIVACY_POLICY_VERSION,
    profile, memberships, sessions, consents, privacyRequests: requests, skills, badges,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mis-datos-sicap.json"',
    },
  });
}
