import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { sanitize, isValidEmail } from '@/lib/utils';

/**
 * POST /api/enrollment
 * 
 * Handles course enrollment after payment.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Sanitize inputs
    const email = sanitize(body.email);
    const nombre = sanitize(body.nombre);
    const telefono = sanitize(body.telefono);
    const cursoSlug = sanitize(body.cursoSlug);
    const grupoId = sanitize(body.grupoId);
    const paymentId = sanitize(body.paymentId);

    if (!email || !nombre || !cursoSlug || !grupoId) {
      return NextResponse.json({ error: 'Faltan campos requeridos o datos inválidos' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const auth = await getAdminAuth();
    const db = await getAdminDb();

    let userId: string;
    let isNewUser = false;
    let tempPassword: string | null = null;

    try {
      const existing = await auth.getUserByEmail(email);
      userId = existing.uid;
    } catch {
      isNewUser = true;
      tempPassword = generatePassword();
      const newUser = await auth.createUser({ email, password: tempPassword, displayName: nombre });
      userId = newUser.uid;
      await db.collection('users').doc(userId).set({
        email, name: nombre, phone: telefono || '',
        role: 'ESTUDIANTE', createdAt: new Date(),
        isActive: true, enrolledCourses: [], source: 'web-enrollment',
      });
    }

    await db.collection('enrollments').doc().set({
      userId, email, cursoSlug, grupoId,
      paymentId: paymentId || null, enrolledAt: new Date(), status: 'active',
    });

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const courses = userDoc.data()?.enrolledCourses || [];
    if (!courses.includes(cursoSlug)) {
      await userRef.update({ enrolledCourses: [...courses, cursoSlug] });
    }

    return NextResponse.json({
      success: true, isNewUser, userId,
      ...(isNewUser && tempPassword ? {
        credentials: { email, tempPassword, message: 'Cuenta creada en SIERCP. Usa estas credenciales en la app.' },
      } : {
        message: 'Inscripción exitosa. El curso ya aparece en tu app SIERCP.',
      }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('Enrollment error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
