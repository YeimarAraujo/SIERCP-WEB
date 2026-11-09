/**
 * Autorización de tratamiento de datos (Ley 1581 de 2012 y Decreto 1377 de
 * 2013, compilado en el Decreto 1074 de 2015).
 *
 * - La autorización debe ser previa, expresa e informada, y el responsable
 *   debe poder probarla: cada aceptación queda en `consents`, sin edición.
 * - Las finalidades opcionales (publicidad) se piden aparte y nunca marcadas.
 * - Niños, niñas y adolescentes: autoriza su representante legal (art. 7 de la
 *   Ley 1581 y art. 12 del Decreto 1377).
 * - Consultas: 10 días hábiles; reclamos: 15 días hábiles (arts. 14 y 15).
 */

/** Cambiarla obliga a todos a aceptar de nuevo. Debe coincidir con la app. */
export const PRIVACY_POLICY_VERSION = '2026-11-07';

export const ADULT_AGE = 18;

export type PrivacyRequestType = 'access' | 'rectification' | 'deletion' | 'revocation' | 'complaint';

/** Consultas (acceso) tienen 10 días hábiles; los reclamos, 15. */
export const RESPONSE_BUSINESS_DAYS: Record<PrivacyRequestType, number> = {
  access: 10,
  rectification: 15,
  deletion: 15,
  revocation: 15,
  complaint: 15,
};

export interface Guardian {
  name: string;
  documentType: string;
  document: string;
  relationship: string;
  email: string;
}

/** Edad cumplida en `today` para una fecha AAAA-MM-DD; null si no es válida. */
export function ageOn(birthDate: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (birth.getUTCMonth() !== month - 1 || birth > today) return null;
  let age = today.getUTCFullYear() - year;
  const beforeBirthday = today.getUTCMonth() < month - 1
    || (today.getUTCMonth() === month - 1 && today.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

export function parseGuardian(value: unknown): Guardian | null {
  if (!value || typeof value !== 'object') return null;
  const g = value as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const v = typeof g[key] === 'string' ? (g[key] as string).trim() : '';
    return v.length > 0 && v.length <= max ? v : null;
  };
  const name = text('name', 120);
  const documentType = text('documentType', 20);
  const document = text('document', 20);
  const relationship = text('relationship', 40);
  const email = text('email', 254);
  if (!name || !documentType || !document || !relationship || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return { name, documentType, document, relationship, email: email.toLowerCase() };
}

/**
 * Fecha límite de respuesta contando solo días hábiles de lunes a viernes. No
 * descuenta festivos, así que el plazo queda igual o antes del legal.
 */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setUTCDate(result.getUTCDate() + 1);
    const weekday = result.getUTCDay();
    if (weekday !== 0 && weekday !== 6) added++;
  }
  return result;
}
