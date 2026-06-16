/**
 * attendance-service.ts — Gestión de asistencia (servidor, adminDb).
 *
 * Escribe registros en `courses/{courseId}/attendance/{studentId__classId}` y
 * recalcula el resumen denormalizado en la matrícula
 * `courses/{courseId}/enrollments/{studentId}` (attendanceRate…), que el emisor
 * de certificados consume para el gating de asistencia.
 */

import admin from 'firebase-admin';
import { adminDb } from './firebase-admin';
import {
    attendanceRecordId,
    computeAttendanceRate,
    type AttendanceStatus,
    type AttendanceMode,
} from '@/shared/types/attendance';

const FieldValue = admin.firestore.FieldValue;
const ATT = 'attendance';

export interface MarkInput {
    courseId: string;
    studentId: string;
    studentName?: string;
    classId: string;
    classLabel?: string;
    status: AttendanceStatus;
    mode?: AttendanceMode;
    justification?: string;
    date?: Date;
    cohortId?: string;
    sessionId?: string;
    markedBy: string;
}

async function courseInstitution(courseId: string): Promise<string> {
    const snap = await adminDb.collection('courses').doc(courseId).get();
    return String(snap.data()?.institutionId ?? '');
}

/** Recalcula y persiste el resumen de asistencia de un estudiante en su matrícula. */
export async function recomputeSummary(courseId: string, studentId: string): Promise<{
    rate: number; attended: number; total: number; excused: number;
}> {
    const snap = await adminDb
        .collection('courses').doc(courseId)
        .collection(ATT)
        .where('studentId', '==', studentId)
        .get();

    const counts = { present: 0, late: 0, absent: 0, excused: 0 };
    snap.docs.forEach((d) => {
        const s = d.data().status as AttendanceStatus;
        if (s in counts) counts[s]++;
    });

    const { rate, attended, total } = computeAttendanceRate(counts);

    // merge: la matrícula puede no existir aún (curso sin enrollment formal).
    await adminDb
        .collection('courses').doc(courseId)
        .collection('enrollments').doc(studentId)
        .set({
            attendanceRate: rate,
            attendancePresent: attended,
            attendanceTotal: total,
            attendanceExcused: counts.excused,
            attendanceUpdatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

    return { rate, attended, total, excused: counts.excused };
}

/** Marca (o actualiza) la asistencia de un estudiante en una clase. Idempotente. */
export async function markAttendance(input: MarkInput): Promise<{ recordId: string; rate: number }> {
    const { courseId, studentId, classId } = input;
    const recordId = attendanceRecordId(studentId, classId);
    const institutionId = await courseInstitution(courseId);
    const date = input.date ?? new Date();

    await adminDb
        .collection('courses').doc(courseId)
        .collection(ATT).doc(recordId)
        .set({
            courseId,
            institutionId,
            cohortId: input.cohortId ?? null,
            sessionId: input.sessionId ?? null,
            classId,
            classLabel: input.classLabel ?? classId,
            studentId,
            studentName: input.studentName ?? '',
            status: input.status,
            mode: input.mode ?? 'presencial',
            justification: input.justification ?? '',
            date: admin.firestore.Timestamp.fromDate(date),
            markedBy: input.markedBy,
            markedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

    const { rate } = await recomputeSummary(courseId, studentId);
    return { recordId, rate };
}

/** Marca asistencia para todo un grupo en una clase (pasa la lista del roster). */
export async function markBulk(opts: {
    courseId: string;
    classId: string;
    classLabel?: string;
    mode?: AttendanceMode;
    markedBy: string;
    date?: Date;
    entries: Array<{ studentId: string; studentName?: string; status: AttendanceStatus; justification?: string }>;
}): Promise<{ updated: number; rates: Record<string, number> }> {
    const rates: Record<string, number> = {};
    for (const e of opts.entries) {
        const { rate } = await markAttendance({
            courseId: opts.courseId,
            classId: opts.classId,
            classLabel: opts.classLabel,
            mode: opts.mode,
            markedBy: opts.markedBy,
            date: opts.date,
            studentId: e.studentId,
            studentName: e.studentName,
            status: e.status,
            justification: e.justification,
        });
        rates[e.studentId] = rate;
    }
    return { updated: opts.entries.length, rates };
}
