import {
    AHA_MIN_DEPTH_MM, AHA_MAX_DEPTH_MM,
    AHA_MIN_RATE, AHA_MAX_RATE, AHA_MAX_PAUSE_SEC,
    SCORE_DEPTH_WEIGHT, SCORE_RATE_WEIGHT,
    SCORE_RECOIL_WEIGHT, SCORE_INTERRUPTION_WEIGHT,
    PASS_SCORE, EXCELLENT_SCORE,
} from './constants';
import type { SessionMetrics } from '@/models/session';

export function calculateDepthScore(averageDepthMm: number): number {
    if (averageDepthMm >= AHA_MIN_DEPTH_MM && averageDepthMm <= AHA_MAX_DEPTH_MM) {
        return SCORE_DEPTH_WEIGHT * 100;
    }
    const delta = averageDepthMm < AHA_MIN_DEPTH_MM
        ? AHA_MIN_DEPTH_MM - averageDepthMm
        : averageDepthMm - AHA_MAX_DEPTH_MM;
    return Math.max(0, SCORE_DEPTH_WEIGHT * 100 - delta * 2);
}

export function calculateRateScore(averageRate: number): number {
    if (averageRate >= AHA_MIN_RATE && averageRate <= AHA_MAX_RATE) {
        return SCORE_RATE_WEIGHT * 100;
    }
    const delta = averageRate < AHA_MIN_RATE
        ? AHA_MIN_RATE - averageRate
        : averageRate - AHA_MAX_RATE;
    return Math.max(0, SCORE_RATE_WEIGHT * 100 - delta * 3);
}

export function calculateRecoilScore(recoilPct: number): number {
    return (Math.min(100, Math.max(0, recoilPct)) / 100) * SCORE_RECOIL_WEIGHT * 100;
}

export function calculateInterruptionScore(
    interruptionCount: number,
    maxPauseSec: number,
): number {
    let score = SCORE_INTERRUPTION_WEIGHT * 100;
    if (interruptionCount > 2) score -= (interruptionCount - 2) * 5;
    if (maxPauseSec > AHA_MAX_PAUSE_SEC) score -= (maxPauseSec - AHA_MAX_PAUSE_SEC) * 3;
    return Math.max(0, score);
}

export function calculateSessionScore(metrics: Partial<SessionMetrics>): number {
    const d = calculateDepthScore(metrics.averageDepthMm ?? 0);
    const r = calculateRateScore(metrics.averageRatePerMin ?? 0);
    const rc = calculateRecoilScore(metrics.recoilPct ?? 100);
    const i = calculateInterruptionScore(metrics.interruptionCount ?? 0, metrics.maxPauseSeconds ?? 0);
    return Math.round(d + r + rc + i);
}

export function isApproved(score: number): boolean {
    return score >= PASS_SCORE;
}

export function isExcellent(score: number): boolean {
    return score >= EXCELLENT_SCORE;
}

export function calculateCCF(
    durationSeconds: number,
    interruptionCount: number,
    maxPauseSec: number,
): number {
    if (durationSeconds <= 0) return 0;
    const pauseTime = interruptionCount * maxPauseSec;
    return Math.min(100, Math.max(0, ((durationSeconds - pauseTime) / durationSeconds) * 100));
}