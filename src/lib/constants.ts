export const ROLE_ADMIN = 'ADMIN' as const;
export const ROLE_INSTRUCTOR = 'INSTRUCTOR' as const;
export const ROLE_STUDENT = 'ESTUDIANTE' as const;

export const ROLES = [ROLE_ADMIN, ROLE_INSTRUCTOR, ROLE_STUDENT] as const;

export type Role = typeof ROLE_ADMIN | typeof ROLE_INSTRUCTOR | typeof ROLE_STUDENT;

export const AHA_MIN_DEPTH_MM = 50;
export const AHA_MAX_DEPTH_MM = 60;
export const AHA_MIN_RATE = 100;
export const AHA_MAX_RATE = 120;
export const AHA_MAX_PAUSE_SEC = 10;

export const SCORE_DEPTH_WEIGHT = 0.4;
export const SCORE_RATE_WEIGHT = 0.3;
export const SCORE_RECOIL_WEIGHT = 0.2;
export const SCORE_INTERRUPTION_WEIGHT = 0.1;

export const PASS_SCORE = 70;
export const EXCELLENT_SCORE = 90;

export const COLOR_EXCELLENT = '#22c55e';
export const COLOR_PASS = '#f59e0b';
export const COLOR_FAIL = '#ef4444';