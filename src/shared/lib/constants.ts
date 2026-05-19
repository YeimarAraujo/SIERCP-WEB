import type { UserRole } from '@/shared/types/user';

// ── Roles ────────────────────────────────────────────────────────────────────
export const ROLE_SUPER_ADMIN  = 'SUPER_ADMIN'  as const;
export const ROLE_ADMIN        = 'ADMIN'         as const;
export const ROLE_INSTRUCTOR   = 'INSTRUCTOR'    as const;
export const ROLE_USUARIO_SST  = 'USUARIO_SST'  as const;
export const ROLE_USUARIO_PRO  = 'USUARIO_PROFESIONAL' as const;
export const ROLE_USUARIO      = 'USUARIO'       as const;

/** @deprecated Use ROLE_USUARIO. Kept temporarily for migration. */
export const ROLE_STUDENT      = ROLE_USUARIO;

export const ROLES: UserRole[] = [
  ROLE_SUPER_ADMIN,
  ROLE_ADMIN,
  ROLE_INSTRUCTOR,
  ROLE_USUARIO_SST,
  ROLE_USUARIO_PRO,
  ROLE_USUARIO,
];

export type Role = UserRole;

// ── Course creation limits ────────────────────────────────────────────────────
export const COURSE_LIMIT_USUARIO     = 5;
export const COURSE_LIMIT_USUARIO_PRO = 10;

// ── AHA 2025 Guidelines ───────────────────────────────────────────────────────
export const AHA_MIN_DEPTH_MM  = 50;
export const AHA_MAX_DEPTH_MM  = 60;
export const AHA_MIN_RATE      = 100;
export const AHA_MAX_RATE      = 120;
export const AHA_MAX_PAUSE_SEC = 10;

// ── CPR Scoring weights ───────────────────────────────────────────────────────
export const SCORE_DEPTH_WEIGHT         = 0.4;
export const SCORE_RATE_WEIGHT          = 0.3;
export const SCORE_RECOIL_WEIGHT        = 0.2;
export const SCORE_INTERRUPTION_WEIGHT  = 0.1;

export const PASS_SCORE      = 70;
export const EXCELLENT_SCORE = 90;

// ── UI Colors ────────────────────────────────────────────────────────────────
export const COLOR_EXCELLENT = '#22c55e';
export const COLOR_PASS      = '#f59e0b';
export const COLOR_FAIL      = '#ef4444';

// ── Idempotency ───────────────────────────────────────────────────────────────
/** Header name used for idempotency keys in API routes. */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
/** TTL for cached idempotency results (24 h in ms). */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
