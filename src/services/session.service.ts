import { serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SessionService as FS } from './firestore.service';
import { calculateSessionScore, isApproved, calculateCCF } from '@/lib/scoring';
import type { SessionModel, SessionMetrics, PatientType } from '@/models/session';

export const SessionManager = {
    async start(params: {
        studentId: string;
        studentName: string;
        scenarioId?: string;
        scenarioTitle?: string;
        patientType: PatientType;
        courseId?: string;
        manikinId?: string;
    }): Promise<string> {
        const session: Omit<SessionModel, 'id'> = {
            ...params,
            status: 'active',
            startedAt: new Date(),
            duration: 0,
        };
        return FS.create(session);
    },

    async end(sessionId: string, metrics: Partial<SessionMetrics>): Promise<void> {
        const endedAt = new Date();
        const session = await FS.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const durationSeconds = Math.round(
            (endedAt.getTime() - session.startedAt.getTime()) / 1000,
        );

        const score = calculateSessionScore(metrics);
        const ccfPct = calculateCCF(
            durationSeconds,
            metrics.interruptionCount ?? 0,
            metrics.maxPauseSeconds ?? 0,
        );

        const finalMetrics: SessionMetrics = {
            totalCompressions: metrics.totalCompressions ?? 0,
            correctCompressions: metrics.correctCompressions ?? 0,
            averageDepthMm: metrics.averageDepthMm ?? 0,
            averageRatePerMin: metrics.averageRatePerMin ?? 0,
            correctCompressionsPct: metrics.correctCompressionsPct ?? 0,
            averageForceKg: metrics.averageForceKg ?? 0,
            recoilPct: metrics.recoilPct ?? 100,
            interruptionCount: metrics.interruptionCount ?? 0,
            maxPauseSeconds: metrics.maxPauseSeconds ?? 0,
            ccfPct: Math.round(ccfPct),
            depthScore: metrics.depthScore ?? 0,
            rateScore: metrics.rateScore ?? 0,
            recoilScore: metrics.recoilScore ?? 0,
            interruptionScore: metrics.interruptionScore ?? 0,
            score,
            approved: isApproved(score),
            violations: metrics.violations ?? [],
        };

        await updateDoc(doc(db, 'sessions', sessionId), {
            status: 'completed',
            endedAt: serverTimestamp(),
            duration: durationSeconds,
            metrics: finalMetrics,
            updatedAt: serverTimestamp(),
        });
    },

    async abort(sessionId: string): Promise<void> {
        await FS.update(sessionId, { status: 'aborted', endedAt: new Date() });
    },
};