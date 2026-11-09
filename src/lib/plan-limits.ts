/** Límites por plan, alineados con el seed platform/config. */
export const PLAN_LIMITS: Record<string, Record<string, number | boolean>> = {
  pyme:          { maxUsers: 15, maxSeats: 1, maxActiveCourses: 3, maxManikins: 1, historyMonths: 6, canUseLiveSessions: false, canUseBiReports: false, canUseApi: false, canUseMultiSite: false, requiresSstLicense: false },
  business:      { maxUsers: 50, maxSeats: 5, maxActiveCourses: 10, maxManikins: 3, historyMonths: 12, canUseLiveSessions: true, canUseBiReports: false, canUseApi: false, canUseMultiSite: false, requiresSstLicense: false },
  corporate:     { maxUsers: 200, maxSeats: 20, maxActiveCourses: 40, maxManikins: 10, historyMonths: 24, canUseLiveSessions: true, canUseBiReports: true, canUseApi: true, canUseMultiSite: true, requiresSstLicense: false },
  enterprise:    { maxUsers: -1, maxSeats: -1, maxActiveCourses: -1, maxManikins: -1, historyMonths: -1, canUseLiveSessions: true, canUseBiReports: true, canUseApi: true, canUseMultiSite: true, requiresSstLicense: false },
  sstSinLicencia:{ maxUsers: 10, maxSeats: 1, maxActiveCourses: 10, maxManikins: 1, historyMonths: 12, canUseLiveSessions: false, canUseBiReports: false, canUseApi: false, canUseMultiSite: false, requiresSstLicense: false },
  sstConLicencia:{ maxUsers: 25, maxSeats: 3, maxActiveCourses: 20, maxManikins: 2, historyMonths: 24, canUseLiveSessions: true, canUseBiReports: true, canUseApi: false, canUseMultiSite: false, requiresSstLicense: true },
};
