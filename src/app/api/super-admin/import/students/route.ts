import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Papa from 'papaparse';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * Importación masiva de estudiantes (S5) con preview / validación / rollback / logs.
 *
 * POST /api/super-admin/import/students
 *   body: { action: 'preview' | 'commit', csv: string, institutionId: string }
 *
 * CSV esperado (cabeceras): nombre, apellido, correo, documento, telefono
 *
 * - preview: valida sin escribir; devuelve filas válidas/ inválidas + resumen.
 * - commit : crea Auth + Firestore por fila válida, registra importJobs/{id} con
 *            los IDs creados y logs. Si algo falla, hace ROLLBACK de lo creado.
 */

export const dynamic = 'force-dynamic';

async function getSuperAdminUid(): Promise<string | null> {
  const c = await cookies();
  const session = c.get('session')?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return decoded['isSuperAdmin'] === true ? decoded.uid : null;
  } catch {
    return null;
  }
}

interface ParsedRow { nombre?: string; apellido?: string; correo?: string; documento?: string; telefono?: string }
interface ValidatedRow { data: ParsedRow; valid: boolean; errors: string[] }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(rows: ParsedRow[]): ValidatedRow[] {
  const seenEmail = new Set<string>();
  return rows.map((r) => {
    const errors: string[] = [];
    const correo = (r.correo ?? '').trim().toLowerCase();
    if (!r.nombre?.trim()) errors.push('nombre requerido');
    if (!correo) errors.push('correo requerido');
    else if (!EMAIL_RE.test(correo)) errors.push('correo inválido');
    else if (seenEmail.has(correo)) errors.push('correo duplicado en archivo');
    if (!r.documento?.trim()) errors.push('documento requerido');
    if (correo) seenEmail.add(correo);
    return { data: { ...r, correo }, valid: errors.length === 0, errors };
  });
}

function randomPassword(): string {
  return Math.random().toString(36).slice(-10) + 'A1!';
}

export async function POST(req: NextRequest) {
  const callerUid = await getSuperAdminUid();
  if (!callerUid) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = (await req.json().catch(() => null)) as
    | { action?: string; csv?: string; institutionId?: string } | null;
  if (!body?.csv || !body.action) {
    return NextResponse.json({ error: 'csv y action requeridos' }, { status: 400 });
  }

  const parsed = Papa.parse<ParsedRow>(body.csv, { header: true, skipEmptyLines: true });
  const validated = validate(parsed.data);
  const validRows = validated.filter((v) => v.valid);
  const summary = { total: validated.length, valid: validRows.length, invalid: validated.length - validRows.length };

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (body.action === 'preview') {
    return NextResponse.json({ summary, rows: validated.slice(0, 500) });
  }

  // ── COMMIT ───────────────────────────────────────────────────────────────────
  if (body.action !== 'commit') {
    return NextResponse.json({ error: 'action inválida' }, { status: 400 });
  }
  if (!body.institutionId) {
    return NextResponse.json({ error: 'institutionId requerido para commit' }, { status: 400 });
  }
  if (validRows.length === 0) {
    return NextResponse.json({ error: 'No hay filas válidas para importar', summary }, { status: 400 });
  }

  const jobRef = adminDb.collection('importJobs').doc();
  const now = admin.firestore.Timestamp.now();
  await jobRef.set({
    id: jobRef.id, type: 'STUDENTS', institutionId: body.institutionId, createdBy: callerUid,
    status: 'COMMITTING', summary, createdAt: now,
  });

  const createdUids: string[] = [];
  const logs: { email: string; status: string; error?: string }[] = [];

  try {
    for (const v of validRows) {
      const email = v.data.correo!;
      try {
        const userRecord = await adminAuth.createUser({
          email, password: randomPassword(),
          displayName: `${v.data.nombre} ${v.data.apellido ?? ''}`.trim(),
        });
        createdUids.push(userRecord.uid);
        await adminDb.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid, email,
          firstName: v.data.nombre, lastName: v.data.apellido ?? '',
          identification: v.data.documento, phoneNumber: v.data.telefono ?? null,
          role: 'USUARIO', isActive: true, status: 'ACTIVE', certVerification: 'NONE',
          coursesCreated: 0, institutionId: body.institutionId,
          createdAt: now, updatedAt: now, importedBy: jobRef.id,
        });
        await adminDb.collection('memberships').doc(`${userRecord.uid}_${body.institutionId}`).set({
          userId: userRecord.uid, institutionId: body.institutionId, role: 'USUARIO',
          status: 'approved', isActive: true, createdAt: now, updatedAt: now,
        });
        logs.push({ email, status: 'created' });
      } catch (e) {
        // Falla en una fila → ROLLBACK total para mantener atomicidad de la importación.
        throw new Error(`Fila ${email}: ${(e as Error).message}`);
      }
    }

    await jobRef.update({ status: 'COMMITTED', committedIds: createdUids, logs, committedAt: admin.firestore.Timestamp.now() });
    return NextResponse.json({ success: true, jobId: jobRef.id, created: createdUids.length, summary });
  } catch (err) {
    // ── ROLLBACK ───────────────────────────────────────────────────────────────
    for (const uid of createdUids) {
      await adminAuth.deleteUser(uid).catch(() => {});
      await adminDb.collection('users').doc(uid).delete().catch(() => {});
      await adminDb.collection('memberships').doc(`${uid}_${body.institutionId}`).delete().catch(() => {});
    }
    await jobRef.update({
      status: 'ROLLED_BACK', logs,
      error: (err as Error).message, rolledBackAt: admin.firestore.Timestamp.now(), rolledBackCount: createdUids.length,
    });
    return NextResponse.json({ error: 'Importación revertida', detail: (err as Error).message, jobId: jobRef.id }, { status: 500 });
  }
}
