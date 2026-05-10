import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { COLOR_EXCELLENT, COLOR_FAIL, COLOR_PASS, EXCELLENT_SCORE, PASS_SCORE } from './constants';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDate(timestamp: Date | null | undefined): string {
    if (!timestamp) return '-';
    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(timestamp);
}

export function formatRelativeTime(timestamp: Date): string {
    const now = Date.now();
    const diff = now - timestamp.getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (mins < 1) return 'Ahora mismo';
    if (mins < 60) return `Hace ${mins} min`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
}

export function getScoreColor(score: number): string {
    if (score >= EXCELLENT_SCORE) return COLOR_EXCELLENT;
    if (score >= PASS_SCORE) return COLOR_PASS;
    return COLOR_FAIL;
}

export function getScoreLabel(score: number): 'Excelente' | 'Aprobado' | 'Reprobado' {
    if (score >= EXCELLENT_SCORE) return 'Excelente';
    if (score >= PASS_SCORE) return 'Aprobado';
    return 'Reprobado';
}

export function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
    if (score >= EXCELLENT_SCORE) return 'default';
    if (score >= PASS_SCORE) return 'secondary';
    return 'destructive';
}

export function clampPercent(value: number): number {
    return Math.min(100, Math.max(0, Math.round(value)));
}

export function isDeviceActive(timestamp: number): boolean {
    return timestamp > 0 && Date.now() - timestamp < 30_000;
}