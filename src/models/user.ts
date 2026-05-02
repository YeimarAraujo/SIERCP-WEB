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

export interface UserModel {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'INSTRUCTOR' | 'ESTUDIANTE';
    avatarUrl?: string;
    identificacion?: string;
    isActive: boolean;
    stats?: UserStats;
    fcmTokens?: string[];
    fcmTokensUpdatedAt?: Date;
    appInstalled?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export function getUserInitials(user: UserModel): string {
    return ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase() || 'U';
}

export function getFullName(user: UserModel): string {
    return `${user.firstName} ${user.lastName}`.trim();
}

export function isAdmin(user: UserModel | null): boolean {
    return user?.role === 'ADMIN';
}

export function isInstructor(user: UserModel | null): boolean {
    return user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
}

export function isStudent(user: UserModel | null): boolean {
    return user?.role === 'ESTUDIANTE';
}