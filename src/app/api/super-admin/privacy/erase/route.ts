/**
 * POST /api/super-admin/privacy/erase  { requestId, confirm: 'ELIMINAR' }
 *
 * Ejecuta una solicitud de supresión: borra el acceso, anonimiza los datos y
 * marca la solicitud como atendida. Irreversible; solo SUPER_ADMIN.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp } from '@/lib/rate-limiter';
import { eraseUser } from '@/lib/erase-user';

export async function POST(req: NextRequest) {
  const auth = await withAuth(req, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  if (typeof body.requestId !== 'string' || body.confirm !== 'ELIMINAR') {
    return NextResponse.json({ error: 'Falta la solicitud o la confirmación.' }, { status: 400 });
  }

  const requestRef = adminDb.collection('privacy_requests').doc(body.requestId);
  const request = (await requestRef.get()).data();
  if (!request || request.type !== 'deletion' || request.status !== 'open') {
    return NextResponse.json({ error: 'La solicitud no existe, no es de eliminación o ya fue atendida.' }, { status: 409 });
  }

  const target = (await adminDb.collection('users').doc(request.userId).get()).data();
  if (target?.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Una cuenta SUPER_ADMIN no se elimina desde aquí.' }, { status: 409 });
  }

  const result = await eraseUser(adminDb, adminAuth, request.userId);
  await requestRef.update({
    status: 'resolved',
    response: 'Cuenta eliminada y datos personales anonimizados. Se conservan las autorizaciones y esta solicitud como constancia.',
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedBy: auth.uid,
  });
  await auditLog({
    type: 'super_admin_action',
    userId: auth.uid,
    metadata: { action: 'erase_user', targetUid: request.userId, requestId: body.requestId, ...result },
    severity: 'CRITICAL',
    ip: getClientIp(req),
  });
  return NextResponse.json({ ok: true, ...result });
}
