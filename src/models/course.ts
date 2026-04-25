export interface Enrollment {
    studentId: string;
    studentName: string;
    studentEmail: string;
    identificacion?: string;
    enrolledAt: Date;
    completedModules: number;
    avgScore: number;
    sessionCount: number;
    status: 'active' | 'completed';
}

export interface CourseModel {
    id: string;
    title: string;
    description?: string;
    instructorId: string;
    instructorName: string;
    instructorEmail?: string;
    inviteCode: string;
    certification: string;
    requiredScore: number;
    isActive: boolean;
    studentCount: number;
    totalModules: number;
    completedModules: number;
    nextDeadline?: Date;
    nextDeadlineTitle?: string;
    guideIds: string[];
    requiredGuideCount: number;
    scenarioMode: 'completo' | 'aleatorio';
    createdAt: Date;
    updatedAt: Date;
}