/**
 * POST /api/attendance — Registro de asistencia (instructor/admin).
 *
 * Acciones:
 *   - 'mark' : un estudiante  { courseId, studentId, classId, status, ... }
 *   - 'bulk' : un grupo       { courseId, classId, entries: [{studentId,status}], ... }
 *
 * Recalcula el resumen en la matrícula (attendanceRate), que alimenta el gating
 * de certificación. Autorización: SUPER_ADMIN, ADMIN o INSTRUCTOR de la institución
 * del curso.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit-logger';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { requireCourseManager } from '@/lib/course-access';
import { markAttendance, markBulk } from '@/lib/attendance-service';
import type { AttendanceStatus, AttendanceMode } from '@/shared/types/attendance';

const VALID_STATUS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    const rl = await rateLimiter.check(`attendance:${ip}`, { max: 120, windowMs: 600_000 });
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

    const courseId = String(body.courseId ?? '');
    if (!courseId) return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });

    // Autorización POR CURSO: instructor asignado, instructor de la institución
    // (membership) o admin. Funciona aunque el rol global sea USUARIO.
    const access = await requireCourseManager(req, courseId);
    if (access instanceof NextResponse) return access;
    const auth = { uid: access.uid };

    const action = String(body.action ?? 'mark');
    const classId = String(body.classId ?? '');
    if (!classId) return NextResponse.json({ error: 'classId requerido' }, { status: 400 });
    const mode = (body.mode === 'virtual' ? 'virtual' : 'presencial') as AttendanceMode;
    const date = body.date ? new Date(String(body.date)) : undefined;

    try {
        if (action === 'bulk') {
            const rawEntries = Array.isArray(body.entries) ? body.entries : [];
            const entries = rawEntries
                .map((e) => e as Record<string, unknown>)
                .filter((e) => e && typeof e.studentId === 'string' && VALID_STATUS.includes(e.status as AttendanceStatus))
                .map((e) => ({
                    studentId: String(e.studentId),
                    studentName: e.studentName ? String(e.studentName) : undefined,
                    status: e.status as AttendanceStatus,
                    justification: e.justification ? String(e.justification) : undefined,
                }));
            if (entries.length === 0) return NextResponse.json({ error: 'entries vacío o inválido' }, { status: 400 });

            const result = await markBulk({
                courseId, classId,
                classLabel: body.classLabel ? String(body.classLabel) : undefined,
                mode, markedBy: auth.uid, date, entries,
            });
            await auditLog({
                type: 'attendance_marked', severity: 'INFO', ip, userId: auth.uid,
                metadata: { mode: 'bulk', courseId, classId, updated: result.updated },
            });
            return NextResponse.json(result);
        }

        // action === 'mark'
        const studentId = String(body.studentId ?? '');
        const status = body.status as AttendanceStatus;
        if (!studentId || !VALID_STATUS.includes(status)) {
            return NextResponse.json({ error: 'studentId/status inválido' }, { status: 400 });
        }
        const result = await markAttendance({
            courseId, studentId, classId,
            studentName: body.studentName ? String(body.studentName) : undefined,
            classLabel: body.classLabel ? String(body.classLabel) : undefined,
            status, mode,
            justification: body.justification ? String(body.justification) : undefined,
            date,
            cohortId: body.cohortId ? String(body.cohortId) : undefined,
            sessionId: body.sessionId ? String(body.sessionId) : undefined,
            markedBy: auth.uid,
        });
        await auditLog({
            type: 'attendance_marked', severity: 'INFO', ip, userId: auth.uid,
            metadata: { mode: 'single', courseId, classId, studentId, status },
        });
        return NextResponse.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error interno';
        console.error('[attendance]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
