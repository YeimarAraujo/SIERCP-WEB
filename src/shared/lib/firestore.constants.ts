/**
 * Firestore collection and field name constants — single source of truth for Web.
 *
 * Mirror of Flutter's AppConstants (siercp_flutter/lib/core/constants/constants.dart).
 * Any addition here MUST be reflected in AppConstants and vice-versa.
 *
 * Rule: never use raw string literals for collection/field names anywhere in the
 * codebase — always import from this file.
 */

// ── Top-level collections ────────────────────────────────────────────────────

export const COL_USERS               = 'users'               as const;
export const COL_INSTITUTIONS        = 'institutions'         as const;
export const COL_MEMBERSHIPS         = 'memberships'          as const;
export const COL_COURSES             = 'courses'              as const;
export const COL_COURSE_TEMPLATES    = 'course_templates'     as const;
export const COL_COHORTS             = 'cohorts'              as const;
export const COL_PLATFORM_ENROLLMENTS = 'platform_enrollments' as const;
export const COL_SESSIONS            = 'sessions'             as const;
export const COL_GUIDES              = 'guides'               as const;
export const COL_MANIKINS            = 'manikins'             as const;
export const COL_SCENARIOS           = 'scenarios'            as const;
export const COL_USER_CERTIFICATES   = 'user_certificates'    as const;
export const COL_CERTIFICATION_PAYMENTS = 'certification_payments' as const;
export const COL_LEADERBOARDS        = 'leaderboards'         as const;
export const COL_QUIZ_TOPICS         = 'quizTopics'           as const;
export const COL_QUIZ_QUESTIONS      = 'quizQuestions'        as const;
export const COL_QUIZ_SESSIONS       = 'quizSessions'         as const;
export const COL_USER_STATS          = 'userStats'            as const;
export const COL_AUDIT_LOGS          = 'audit_logs'           as const;
export const COL_NOTIFICATIONS       = 'notifications'        as const;
export const COL_SUPPORT_TICKETS     = 'supportTickets'       as const;
export const COL_COURSE_LIMITS       = 'course_limits'        as const;
export const COL_PAYMENTS            = 'payments'             as const;
export const COL_TRANSACTIONS        = 'transactions'         as const;
export const COL_ORDERS              = 'orders'               as const;
export const COL_CHECKOUT_SESSIONS   = 'checkout_sessions'    as const;
export const COL_STUDENT_PROGRESS    = 'student_progress'     as const;
export const COL_DISCOUNT_CODES      = 'discount_codes'       as const;

// ── Subcollections ────────────────────────────────────────────────────────────

export const SUBCOL_ENROLLMENTS      = 'enrollments'          as const;
export const SUBCOL_MODULES          = 'modules'              as const;
export const SUBCOL_COMPRESSIONS     = 'compressions'         as const;
export const SUBCOL_COMPRESSION_BATCHES = 'compression_batches' as const;
export const SUBCOL_ALERTS           = 'alerts'               as const;
export const SUBCOL_ATTENDANCE       = 'attendance'           as const;
export const SUBCOL_GUIDE_PROGRESS   = 'guideProgress'        as const;
export const SUBCOL_STUDENTS         = 'students'             as const; // leaderboards/{org}/students
export const SUBCOL_PLAN_MEMBERSHIP  = 'planMembership'       as const;

// ── Membership ID convention ──────────────────────────────────────────────────

/** Builds the deterministic document ID for a membership. */
export const membershipId = (userId: string, institutionId: string): string =>
  `${userId}_${institutionId}`;

/** Builds the deterministic document ID for student progress. */
export const studentProgressId = (userId: string, courseId: string): string =>
  `${userId}_${courseId}`;

// ── Field names: users ────────────────────────────────────────────────────────

export const F_USER = {
  uid:                 'uid',
  email:               'email',
  firstName:           'firstName',
  lastName:            'lastName',
  role:                'role',
  avatarUrl:           'avatarUrl',
  identification:      'identification',      // ← canonical (Web and Flutter)
  identificationType:  'identificationType',  // 'CC' | 'CE' | 'PASSPORT' | 'NIT' | 'TI'
  phoneNumber:         'phoneNumber',
  address:             'address',
  city:                'city',
  department:          'department',
  country:             'country',
  isActive:            'isActive',
  institutionId:       'institutionId',
  status:              'status',              // 'PENDING' | 'ACTIVE'
  certVerification:    'certVerification',
  coursesCreated:      'coursesCreated',
  fcmTokens:           'fcmTokens',
  createdAt:           'createdAt',
  updatedAt:           'updatedAt',
} as const;

// ── Field names: institutions ─────────────────────────────────────────────────

export const F_INSTITUTION = {
  id:                  'id',
  name:                'name',
  code:                'code',
  nit:                 'nit',
  mode:                'mode',               // 'AUTOMATED' | 'MANUAL'
  type:                'type',
  address:             'address',
  city:                'city',
  department:          'department',
  country:             'country',
  contactEmail:        'contactEmail',
  contactPhone:        'contactPhone',
  logoUrl:             'logoUrl',
  primaryAdminId:      'primaryAdminId',
  memberCount:         'memberCount',
  activeCoursesCount:  'activeCoursesCount',
  totalSessionsCount:  'totalSessionsCount',
  planType:            'planType',
  status:              'status',
  planActivatedAt:     'planActivatedAt',
  planExpiresAt:       'planExpiresAt',
  maxDevices:          'maxDevices',
  maxInstructors:      'maxInstructors',
  maxStudents:         'maxStudents',
  createdAt:           'createdAt',
  updatedAt:           'updatedAt',
  createdBy:           'createdBy',
} as const;

// ── Field names: memberships ──────────────────────────────────────────────────

export const F_MEMBERSHIP = {
  id:                  'id',
  userId:              'userId',
  institutionId:       'institutionId',
  role:                'role',
  status:              'status',             // 'pending' | 'approved' | 'rejected' | 'suspended'
  isActive:            'isActive',
  invitedBy:           'invitedBy',
  joinedAt:            'joinedAt',
  updatedAt:           'updatedAt',
} as const;

// ── Field names: courses ──────────────────────────────────────────────────────

export const F_COURSE = {
  id:                  'id',
  title:               'title',
  description:         'description',
  instructorId:        'instructorId',
  instructorName:      'instructorName',
  institutionId:       'institutionId',
  inviteCode:          'inviteCode',
  certification:       'certification',
  minScore:            'minScore',
  isActive:            'isActive',
  studentCount:        'studentCount',
  moduleCount:         'moduleCount',
  totalModules:        'totalModules',
  guideIds:            'guideIds',
  scenarioMode:        'scenarioMode',       // 'completo' | 'aleatorio'
  createdAt:           'createdAt',
  updatedAt:           'updatedAt',
  createdBy:           'createdBy',
} as const;

// ── Field names: sessions ─────────────────────────────────────────────────────

export const F_SESSION = {
  id:                  'id',
  studentId:           'studentId',
  studentName:         'studentName',
  courseId:            'courseId',
  manikinId:           'manikinId',
  scenarioId:          'scenarioId',
  patientType:         'patientType',        // 'adult' | 'pediatric' | 'infant'
  status:              'status',             // 'pending' | 'active' | 'completed' | 'aborted'
  startedAt:           'startedAt',
  endedAt:             'endedAt',
  duration:            'duration',
  institutionId:       'institutionId',
  // Live telemetry fields (written by Flutter every 3s)
  currentDepthMm:      'currentDepthMm',
  currentRatePerMin:   'currentRatePerMin',
  totalCompressions:   'totalCompressions',
  correctCompressions: 'correctCompressions',
  score:               'score',        // canonical — use this
  qualityScore:        'qualityScore', // alias — kept for backward compat
  lastBatchAt:         'lastBatchAt',
  createdAt:           'createdAt',
  updatedAt:           'updatedAt',
} as const;

// ── Field names: session metrics (embedded in sessions doc) ───────────────────

export const F_SESSION_METRICS = {
  totalCompressions:      'totalCompressions',
  correctCompressions:    'correctCompressions',
  averageDepthMm:         'averageDepthMm',
  averageRatePerMin:      'averageRatePerMin',
  correctCompressionsPct: 'correctCompressionsPct',
  averageForceKg:         'averageForceKg',   // ← canonical spelling (NOT averageForcKg)
  recoilPct:              'recoilPct',
  interruptionCount:      'interruptionCount',
  maxPauseSeconds:        'maxPauseSeconds',
  ccfPct:                 'ccfPct',
  depthScore:             'depthScore',
  rateScore:              'rateScore',
  recoilScore:            'recoilScore',
  interruptionScore:      'interruptionScore',
  score:                  'score',
  approved:               'approved',
  violations:             'violations',
} as const;

// ── Field names: modules ──────────────────────────────────────────────────────

export const F_MODULE = {
  id:               'id',
  courseId:         'courseId',
  title:            'title',
  type:             'type',           // 'teoria' | 'evaluacion_teorica' | 'practica_guiada' | 'certificacion'
  order:            'order',
  contentUrl:       'contentUrl',
  videoUrl:         'videoUrl',
  quizQuestions:    'quizQuestions',
  passingScore:     'passingScore',
  estimatedMinutes: 'estimatedMinutes',
  isRequired:       'isRequired',
} as const;

// ── Field names: student_progress ────────────────────────────────────────────

export const F_STUDENT_PROGRESS = {
  userId:           'userId',
  courseId:         'courseId',
  institutionId:    'institutionId',
  completedModules: 'completedModules', // string[] of moduleIds
  moduleScores:     'moduleScores',     // Record<moduleId, score>
  overallStatus:    'overallStatus',    // 'not_started' | 'in_progress' | 'completed'
  startedAt:        'startedAt',
  updatedAt:        'updatedAt',
} as const;

// ── Field names: quizSessions ─────────────────────────────────────────────────

export const F_QUIZ_SESSION = {
  userId:      'userId',
  topicId:     'topicId',
  type:        'type',           // 'theoretical' | 'practical_eval'
  score:       'score',
  passed:      'passed',
  xpEarned:    'xpEarned',
  completedAt: 'completedAt',
} as const;

// ── Field names: userStats ────────────────────────────────────────────────────

export const F_USER_STATS = {
  xp:                  'xp',
  level:               'level',
  quizzesCompleted:    'quizzesCompleted',
  quizAverageScore:    'quizAverageScore',
  badges:              'badges',
  totalSessions:       'totalSessions',
  averageScore:        'averageScore',
  totalHours:          'totalHours',
  bestScore:           'bestScore',
  totalQuizSessions:   'totalQuizSessions',
  certificatesEarned:  'certificatesEarned',
  updatedAt:           'updatedAt',
} as const;

// ── Module types ──────────────────────────────────────────────────────────────

export const MODULE_TYPES = {
  TEORIA:             'teoria',
  EVALUACION_TEORICA: 'evaluacion_teorica',
  PRACTICA_GUIADA:    'practica_guiada',
  CERTIFICACION:      'certificacion',
} as const;

export type ModuleTypeValue = typeof MODULE_TYPES[keyof typeof MODULE_TYPES];

// ── Patient types ─────────────────────────────────────────────────────────────

export const PATIENT_TYPES = {
  ADULT:     'adult',
  PEDIATRIC: 'pediatric',
  INFANT:    'infant',
} as const;

export type PatientTypeValue = typeof PATIENT_TYPES[keyof typeof PATIENT_TYPES];

// ── Session statuses ──────────────────────────────────────────────────────────

export const SESSION_STATUS = {
  PENDING:   'pending',
  ACTIVE:    'active',
  COMPLETED: 'completed',
  ABORTED:   'aborted',
} as const;

export type SessionStatusValue = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

// ── Institution statuses ──────────────────────────────────────────────────────

export const INSTITUTION_STATUS = {
  ACTIVE:    'active',
  SUSPENDED: 'suspended',
  PENDING:   'pending',
  REJECTED:  'rejected',
} as const;

// ── Membership statuses ───────────────────────────────────────────────────────

export const MEMBERSHIP_STATUS = {
  PENDING:   'pending',
  APPROVED:  'approved',
  REJECTED:  'rejected',
  SUSPENDED: 'suspended',
} as const;

// ── Scenario modes ────────────────────────────────────────────────────────────

export const SCENARIO_MODES = {
  COMPLETO:  'completo',
  ALEATORIO: 'aleatorio',
} as const;

// ── Cert verification statuses ────────────────────────────────────────────────

export const CERT_STATUS = {
  NONE:     'NONE',
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

// ── User/account statuses ─────────────────────────────────────────────────────

export const ACCOUNT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE:  'ACTIVE',
} as const;
