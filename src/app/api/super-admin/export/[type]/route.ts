import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Papa from 'papaparse';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * Exportación CSV para Super Admin (S5).
 * GET /api/super-admin/export/{type}
 *   type: students | instructors | courses | purchases | skills
 * Seguridad: verifica session cookie + claim isSuperAdmin.
 */

export const dynamic = 'force-dynamic';

async function assertSuperAdmin(): Promise<boolean> {
  const c = await cookies();
  const session = c.get('session')?.value;
  if (!session) return false;
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return decoded['isSuperAdmin'] === true;
  } catch {
    return false;
  }
}

type Row = Record<string, string | number>;

async function buildRows(type: string): Promise<Row[]> {
  const db = adminDb;
  switch (type) {
    case 'students': {
      const snap = await db.collection('users').where('role', 'in', ['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL']).get();
      return snap.docs.map((d) => {
        const u = d.data();
        return {
          nombre: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
          documento: u.identification ?? '',
          correo: u.email ?? '',
          telefono: u.phoneNumber ?? '',
          institucionId: u.institutionId ?? '',
          skills: u.skillsCount ?? 0,
          rol: u.role ?? '',
          registro: u.createdAt?.toDate?.()?.toISOString?.() ?? '',
        };
      });
    }
    case 'instructors': {
      const snap = await db.collection('users').where('role', '==', 'INSTRUCTOR').get();
      return snap.docs.map((d) => {
        const u = d.data();
        return {
          nombre: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
          correo: u.email ?? '',
          institucionId: u.institutionId ?? '',
          cursosCreados: u.coursesCreated ?? 0,
          ingreso: u.createdAt?.toDate?.()?.toISOString?.() ?? '',
        };
      });
    }
    case 'courses': {
      const snap = await db.collection('courses').get();
      return snap.docs.map((d) => {
        const c = d.data();
        return {
          titulo: c.title ?? '',
          institucionId: c.institutionId ?? '',
          activo: c.isActive ? 'sí' : 'no',
          inscritos: c.memberCount ?? c.studentsCount ?? 0,
          creado: c.createdAt?.toDate?.()?.toISOString?.() ?? '',
        };
      });
    }
    case 'purchases': {
      const snap = await db.collection('transactions').where('status', '==', 'APPROVED').get();
      return snap.docs.map((d) => {
        const t = d.data();
        return {
          usuario: t.user_id ?? '',
          tipo: t.type ?? '',
          referencia: t.curso_slug ?? t.planType ?? '',
          montoCOP: ((t.amount_in_cents ?? 0) as number) / 100,
          estado: t.status ?? '',
          fecha: t.createdAt?.toDate?.()?.toISOString?.() ?? '',
        };
      });
    }
    case 'skills': {
      const snap = await db.collection('userSkills').get();
      return snap.docs.map((d) => {
        const s = d.data();
        return {
          codigo: s.skillCode ?? '',
          usuario: s.userId ?? '',
          skill: s.skillName ?? '',
          nivel: s.level ?? '',
          score: s.bestScore ?? 0,
          estado: s.status ?? '',
          emitida: s.issuedAt?.toDate?.()?.toISOString?.() ?? '',
        };
      });
    }
    default:
      return [];
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  if (!(await assertSuperAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { type } = await params;
  const valid = ['students', 'instructors', 'courses', 'purchases', 'skills'];
  if (!valid.includes(type)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }

  const rows = await buildRows(type);
  const csv = Papa.unparse(rows, { quotes: true });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
