/**
 * course-access.ts — Autorización POR CURSO (no por rol global).
 *
 * Un instructor puede tener rol global `USUARIO` pero estar asignado a un curso
 * (instructorId/instructorIds) o ser INSTRUCTOR/ADMIN de la institución vía
 * `memberships`. Por eso la autorización de acciones del curso (asistencia,
 * progreso, edición) NO debe basarse en el rol global.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

export interface CourseAccess {
    uid: string;
    role: string;
    institutionId?: string;
    course: FirebaseFirestore.DocumentData;
    courseId: string;
    isAdmin: boolean;       // ADMIN/SUPER_ADMIN con alcance sobre el curso
    canManage: boolean;     // puede gestionar el curso (asistencia/progreso/edición)
}

async function hasInstructorMembership(uid: string, institutionId: string): Promise<boolean> {
    if (!institutionId) return false;
    const snap = await adminDb.collection('memberships')
        .where('userId', '==', uid).where('isActive', '==', true).get();
    return snap.docs.some((d) => {
        const m = d.data();
        return m.institutionId === institutionId && ['INSTRUCTOR', 'ADMIN'].includes(m.role);
    });
}

/**
 * Verifica el token y el acceso de gestión al curso. Devuelve `CourseAccess` o
 * un `NextResponse` de error (401/404/403) listo para retornar.
 */
export async function requireCourseManager(
    req: NextRequest, courseId: string,
): Promise<CourseAccess | NextResponse> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    let decoded: { uid: string };
    try {
        decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    } catch {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    const uid = decoded.uid;

    const [userSnap, courseSnap] = await Promise.all([
        adminDb.collection('users').doc(uid).get(),
        adminDb.collection('courses').doc(courseId).get(),
    ]);
    if (!courseSnap.exists) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    const user = userSnap.data() ?? {};
    const role = String(user.role ?? 'USUARIO');
    const course = courseSnap.data()!;

    const isAssigned =
        course.instructorId === uid ||
        (Array.isArray(course.instructorIds) && course.instructorIds.includes(uid));
    const isAdmin =
        ['ADMIN', 'SUPER_ADMIN'].includes(role) &&
        (role === 'SUPER_ADMIN' || user.institutionId === course.institutionId);
    const isMember = isAssigned || isAdmin
        ? true
        : await hasInstructorMembership(uid, String(course.institutionId ?? ''));

    const canManage = isAssigned || isAdmin || isMember;
    if (!canManage) {
        return NextResponse.json({ error: 'No tienes acceso a este curso' }, { status: 403 });
    }

    return {
        uid, role, institutionId: user.institutionId, course, courseId,
        isAdmin, canManage,
    };
}
