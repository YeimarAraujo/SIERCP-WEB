export type SessionStatus = 'pending' | 'active' | 'completed' | 'aborted';
export type PatientType = 'adult' | 'pediatric' | 'infant';

export interface AhaViolation {
    type: string;
    message: string;
    count: number;
}

export interface SessionMetrics {
    totalCompressions: number;
    correctCompressions: number;
    averageDepthMm: number;
    averageRatePerMin: number;
    correctCompressionsPct: number;
    averageForceKg: number;
    recoilPct: number;
    interruptionCount: number;
    maxPauseSeconds: number;
    ccfPct: number;
    depthScore: number;
    rateScore: number;
    recoilScore: number;
    interruptionScore: number;
    score: number;
    approved: boolean;
    violations: AhaViolation[];
}

export interface SessionModel {
    id: string;
    studentId: string;
    studentName: string;
    scenarioId?: string;
    scenarioTitle?: string;
    patientType: PatientType;
    status: SessionStatus;
    startedAt: Date;
    endedAt?: Date;
    duration: number;
    metrics?: SessionMetrics;
    courseId?: string;
    manikinId?: string;
}

export interface CompressionReading {
    timestamp: number;
    depthMm: number;
    forceKg: number;
    isCorrect: boolean;
    recoilOk: boolean;
}