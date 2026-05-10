export type ModuleType = 
  | 'teoria' 
  | 'evaluacion_teorica' 
  | 'practica_guiada' 
  | 'certificacion';

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  type: ModuleType;
  order: number;
  contentUrl?: string;
  videoUrl?: string;
  quizQuestions?: number;
  passingScore?: number;
  estimatedMinutes?: number;
  isRequired: boolean;
}

export interface StudentProgress {
  completedModules: string[];
  quizScores: Record<string, number>;
  lastAccessedAt?: Date;
  completedAt?: Date;
}