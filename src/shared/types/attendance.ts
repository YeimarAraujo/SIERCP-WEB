/**
 * Modelo de ASISTENCIA (Fase 2).
 *
 * Decisión de arquitectura (reutilización, no colecciones redundantes):
 *   - `attendance_records` ≡ subcolección `courses/{courseId}/attendance/{recordId}`
 *     (constante existente SUBCOL_ATTENDANCE = 'attendance'). Un doc por
 *     (estudiante, clase): id determinístico `${studentId}__${classId}`.
 *   - `attendance_summary` ≡ campos de resumen escritos en la MATRÍCULA existente
 *     `courses/{courseId}/enrollments/{studentId}` (attendanceRate, present, total…).
 *     El emisor de certificados ya lee `enrollment.attendanceRate`, así que el
 *     gating de asistencia funciona sin nuevas estructuras.
 *
 * Soporta asistencia presencial y virtual y opcionalmente vincula una `sessionId`
 * de simulación, integrando cursos · cohortes · sesiones · estudiantes · instructores.
 */

import { Timestamp } from 'firebase/firestore';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceMode = 'presencial' | 'virtual';

export interface AttendanceRecord {
    id: string;                 // `${studentId}__${classId}`
    courseId: string;
    institutionId: string;
    cohortId?: string;          // si la clase pertenece a una cohorte
    sessionId?: string;         // si se derivó de una sesión de simulación
    classId: string;            // identificador de la clase (p.ej. fecha ISO o uuid)
    classLabel: string;         // etiqueta legible: "Clase 3 — 12 jun"
    studentId: string;
    studentName: string;
    status: AttendanceStatus;
    mode: AttendanceMode;
    justification?: string;     // para 'excused'/'late'
    date: Timestamp | Date;     // fecha de la clase
    markedBy: string;           // uid del instructor/admin
    markedAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

/** Resumen denormalizado en la matrícula. */
export interface AttendanceSummary {
    attendanceRate: number;     // 0–100 (consumido por el gating de certificados)
    attendancePresent: number;  // present + late (cuentan como asistencia)
    attendanceTotal: number;    // clases consideradas (excluye 'excused')
    attendanceExcused: number;
    attendanceUpdatedAt: Timestamp | Date;
}

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
    present: 'Presente',
    absent: 'Ausente',
    late: 'Tarde',
    excused: 'Justificada',
};

/** id determinístico e idempotente del registro de asistencia. */
export function attendanceRecordId(studentId: string, classId: string): string {
    return `${studentId}__${classId}`;
}

/**
 * Calcula la tasa de asistencia a partir de conteos.
 * - 'present' y 'late' cuentan como asistencia.
 * - 'excused' se excluye del denominador (no penaliza).
 * - 'absent' penaliza.
 */
export function computeAttendanceRate(counts: {
    present: number; late: number; absent: number; excused: number;
}): { rate: number; attended: number; total: number } {
    const attended = counts.present + counts.late;
    const total = counts.present + counts.late + counts.absent; // excused excluido
    const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
    return { rate, attended, total };
}
