import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { COLOR_EXCELLENT, COLOR_FAIL, COLOR_PASS, EXCELLENT_SCORE, PASS_SCORE } from "@/shared/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function sanitize(input: string | any): string | any {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    // Remove potential script tags
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    // Remove other dangerous HTML tags
    .replace(/<[^>]*>?/gm, "")
    // Prevent common SQL/NoSQL injection characters if needed
    // (Firestore handles this mostly, but good to be clean)
    .slice(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatRelativeTime(timestamp: Date): string {
  const diff = Date.now() - timestamp.getTime();
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
