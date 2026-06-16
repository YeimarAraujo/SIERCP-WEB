export interface Enrollment {
    studentId: string;
    studentName: string;
    studentEmail: string;
    identificacion?: string;
    enrolledAt: Date;
    completedModules: number;
    avgScore: number;
    sessionCount: number;
    status: 'active' | 'completed';
    grupoId?: string; // Nuevo: Para rastrear en qué horario se inscribió
}

export interface CourseModel {
    id: string;
    title: string;
    description?: string;
    instructorId: string;
    instructorName: string;
    instructorEmail?: string;
    institutionId: string;
    institutionName?: string;
    createdBy?: string;
    inviteCode: string;
    certification: string;
    minScore: number;
    /** Asistencia mínima exigida (0–100) para el gating de certificación. 0 = no exigida. */
    minAttendance?: number;
    /** Fecha final del curso. Dispara la generación automática de certificados (Fase 3). */
    endDate?: Date;
    /** Marca de proceso del cron de generación automática (idempotencia). */
    certsGeneratedAt?: Date;
    requiredScore?: number;
    totalModules?: number;
    requirements?: string[];
    instructorIds?: string[];
    studentIds?: string[];
    isActive: boolean;
    studentCount: number;
    moduleCount: number;
    completedModules?: number;
    nextDeadline?: Date;
    nextDeadlineTitle?: string;
    guideIds: string[];
    requiredGuideCount: number;
    scenarioMode: 'completo' | 'aleatorio';
    createdAt: Date;
    updatedAt: Date;
}