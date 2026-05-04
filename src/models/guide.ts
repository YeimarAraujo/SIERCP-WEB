export type GuideCategory = 'tecnica' | 'teoria' | 'seguridad' | 'emergencias' | 'equipamiento';
export type GuideContentType = 'pdf' | 'video' | 'quiz' | 'external';

export interface GuideModel {
    id: string;
    title: string;
    description: string;
    courseId: string;
    contentType: GuideContentType;
    contentUrl: string; // Generic URL for PDF, Video or External
    uploadedBy: string;
    uploaderName: string;
    uploadedAt: Date;
    category: GuideCategory;
    required: boolean;
    order: number;
    estimatedMinutes: number;
}

export interface GuideProgress {
    guideId: string;
    userId: string;
    completed: boolean;
    completedAt?: Date;
    timeSpentSeconds: number;
    viewCount: number;
    lastPageReached: number;
}

export const CATEGORY_LABELS: Record<GuideCategory, string> = {
    tecnica: 'Técnica',
    teoria: 'Teoría',
    seguridad: 'Seguridad',
    emergencias: 'Emergencias',
    equipamiento: 'Equipamiento',
};

export const CATEGORY_EMOJIS: Record<GuideCategory, string> = {
    tecnica: '🤲',
    teoria: '📖',
    seguridad: '🛡️',
    emergencias: '🚨',
    equipamiento: '🔧',
};
