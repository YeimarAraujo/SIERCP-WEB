import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitiza una cadena de texto eliminando HTML, scripts y caracteres
 * de control que podrían ser usados en inyecciones.
 * Acepta cualquier tipo y retorna el mismo tipo si no es string.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitize(input: string | any, maxLen = 1000): string | any {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    /* Elimina etiquetas <script> completas con su contenido */
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, '')
    /* Elimina cualquier otra etiqueta HTML */
    .replace(/<[^>]*>?/gm, '')
    /* Elimina caracteres de control ASCII (excepto espacio, tab y newline normales) */
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    /* Normaliza espacios múltiples en uno */
    .replace(/\s{2,}/g, ' ')
    /* Límite de longitud configurable */
    .slice(0, maxLen);
}

/** Valida formato de email con regex RFC-compatible */
export function isValidEmail(email: string): boolean {
  /* RFC 5322 simplificado — cubre el 99.9 % de emails reales */
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida que un monto en centavos sea razonable para un pago.
 * Evita que se procesen montos negativos o extremadamente altos.
 */
export function isValidAmountCents(cents: unknown): boolean {
  if (typeof cents !== 'number' || !Number.isInteger(cents)) return false;
  /* Mínimo: $100 COP · Máximo: $50.000.000 COP (5 mil millones de centavos) */
  return cents >= 100 && cents <= 5_000_000_000;
}

/** Formatea una fecha en español colombiano */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/** Formatea un número como moneda COP */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea segundos en una cadena legible (mm:ss o hh:mm:ss).
 * Ejemplo: 3725 → "1h 02m 05s"
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

/**
 * Formatea una fecha pasada como tiempo relativo en español.
 * Ejemplo: "hace 3 días", "hace 2 horas"
 */
export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days !== 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months !== 1 ? 'es' : ''}`;
}

/**
 * Devuelve el color CSS según un score de calidad RCP (0-100).
 * Verde ≥ 80 · Naranja ≥ 60 · Rojo < 60
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#D97706';
  return '#DC2626';
}

/**
 * Devuelve la etiqueta textual según el score de calidad RCP.
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Aceptable';
  return 'Mejorable';
}
