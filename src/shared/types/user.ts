// ── Role types ──────────────────────────────────────────────────────────────

/**
 * System roles — ordered from highest to lowest privilege.
 *
 * SUPER_ADMIN   → Jomar Segurid engineers only. Creates ADMIN accounts, full monitoring.
 * ADMIN         → Institution accounts. Registers/adds instructors for their org.
 * INSTRUCTOR    → Added by an ADMIN. Runs live training sessions.
 * USUARIO_SST   → User holding a valid SST (Seguridad y Salud en el Trabajo) license.
 *                 Gets more benefits; must purchase SST plans to unlock them.
 * USUARIO_PROFESIONAL → User with a professional certificate (no SST license).
 *                 Can create up to 10 courses. Must pay per-student to issue certifications.
 * USUARIO       → Formerly ESTUDIANTE. Basic user. Can create up to 3 courses.
 */
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INSTRUCTOR'
  | 'USUARIO_SST'
  | 'USUARIO_PROFESIONAL'
  | 'USUARIO';

/** Verification status of a user's professional or SST certificate. */
export type CertVerificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** Uploaded certificate record stored in user_certificates collection. */
export interface UserCertificate {
  id: string;
  userId: string;
  type: 'PROFESIONAL' | 'SST_LICENCIA' | 'AHA' | 'OTRO';
  issuer: string;           // Ministerio de Educación | Ministerio de Salud | AHA | etc.
  certificateNumber: string;
  issueDate: string;        // ISO date string
  expiryDate?: string;
  fileUrl: string;          // Firebase Storage URL
  verificationStatus: CertVerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;      // uid of SUPER_ADMIN who approved
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Per-role course creation limits. */
export const COURSE_LIMITS: Record<UserRole, number> = {
  SUPER_ADMIN: Infinity,
  ADMIN: Infinity,
  INSTRUCTOR: Infinity,
  USUARIO_SST: Infinity,        // plan-limited at subscription level
  USUARIO_PROFESIONAL: 10,
  USUARIO: 3,
};

export interface UserStats {
  totalSessions: number;
  sessionsToday: number;
  averageScore: number;
  bestScore: number;
  streakDays: number;
  totalHours: number;
  averageDepthMm: number;
  averageRatePerMin: number;
}

export interface UserCourseRef {
  courseId: string;
  slug: string;
  title: string;
  cohortId?: string;
  enrollmentId?: string;
  institutionId?: string;
  status: 'active' | 'completed' | 'cancelled';
  enrolledAt?: Date;
}

export interface UserModel {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  role: UserRole;
  avatarUrl?: string;
  identificacion?: string;
  isActive: boolean;
  institutionId: string;
  phoneNumber?: string;
  courses?: UserCourseRef[];
  status: 'PENDING' | 'ACTIVE';
  certVerification: CertVerificationStatus;
  coursesCreated: number;
  stats?: UserStats;
  fcmTokens?: string[];
  fcmTokensUpdatedAt?: Date;
  memberships?: string[];
  appInstalled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Utility helpers ──────────────────────────────────────────────────────────

export function getUserInitials(user: UserModel): string {
  return ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase() || 'U';
}

export function getFullName(user: UserModel): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Administrador',
    ADMIN: 'Administrador',
    INSTRUCTOR: 'Instructor',
    USUARIO_SST: 'Usuario SST',
    USUARIO_PROFESIONAL: 'Usuario Profesional',
    USUARIO: 'Usuario',
  };
  return labels[role] ?? role;
}

export function isAdmin(user: UserModel | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

export function isSuperAdmin(user: UserModel | null): boolean {
  return user?.role === 'SUPER_ADMIN';
}

export function isInstructor(user: UserModel | null): boolean {
  return user?.role === 'INSTRUCTOR' || isAdmin(user);
}

export function isUsuario(user: UserModel | null): boolean {
  return (
    user?.role === 'USUARIO' ||
    user?.role === 'USUARIO_PROFESIONAL' ||
    user?.role === 'USUARIO_SST'
  );
}

/** Legacy compat — true for any non-admin, non-instructor user. */
export function isStudent(user: UserModel | null): boolean {
  return isUsuario(user);
}

export function canCreateMoreCourses(user: UserModel): boolean {
  const limit = COURSE_LIMITS[user.role];
  return (user.coursesCreated ?? 0) < limit;
}

export function mustPayToCertify(user: UserModel): boolean {
  return user.role === 'USUARIO_PROFESIONAL';
}

export function hasSSTLicense(user: UserModel): boolean {
  return user.role === 'USUARIO_SST';
}
