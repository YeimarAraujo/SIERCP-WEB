/**
 * Competency Intelligence Engine — versión Vercel (Spark, sin Cloud Functions).
 *
 * Portado de siercp_flutter/functions/src/skills/engine.ts para correr en
 * Next.js API routes (Admin SDK). El proyecto está en plan Spark: NO se despliegan
 * Cloud Functions; toda la lógica de servidor vive en Vercel (gratis).
 *
 * Lo invocan las API routes (p.ej. /api/skills/evaluate, completar curso/sesión).
 * El cliente NUNCA escribe userSkills.
 */
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

const db = adminDb;
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

export type SkillLevelName = 'BASICO' | 'INTERMEDIO' | 'AVANZADO' | 'PROFESIONAL';
export interface SkillLevel { level: SkillLevelName; order: 1 | 2 | 3 | 4; minScore: number; label: string }
export interface Evidence { type: 'TELEMETRY' | 'QUIZ' | 'COURSE'; ref: string; score: number; capturedAt: admin.firestore.Timestamp; patientType?: 'ADULT' | 'CHILD' | 'INFANT' }
interface Skill { id: string; name: string; description: string; levels: SkillLevel[]; triggers: any[]; issuerType: string; issuerInstitutionId?: string | null; active: boolean }

// Caché de catálogo (lambda warm) — TTL 5 min
let _cache: Skill[] | null = null;
let _cacheAt = 0;
async function loadActiveSkills(): Promise<Skill[]> {
  if (_cache && Date.now() - _cacheAt < 5 * 60 * 1000) return _cache;
  const snap = await db.collection('skills').where('active', '==', true).get();
  _cache = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Skill, 'id'>) }));
  _cacheAt = Date.now();
  return _cache;
}

function matchingSkills(skills: Skill[], ev: Evidence): Skill[] {
  return skills.filter((s) => (s.triggers ?? []).some((t: any) => {
    if (t.type === 'SESSION' && ev.type === 'TELEMETRY') {
      if (t.patientType && ev.patientType && t.patientType !== ev.patientType) return false;
      return true;
    }
    if (t.type === 'QUIZ' && ev.type === 'QUIZ') return t.topicId === ev.ref;
    if (t.type === 'COURSE' && ev.type === 'COURSE') return !t.courseId || t.courseId === ev.ref;
    return false;
  }));
}

function highestLevelMet(skill: Skill, score: number): SkillLevel | null {
  return [...(skill.levels ?? [])].sort((a, b) => b.order - a.order).find((l) => score >= l.minScore) ?? null;
}

async function nextSkillCode(tx: admin.firestore.Transaction): Promise<string> {
  const ref = db.doc('platform/counters');
  const snap = await tx.get(ref);
  const seq = ((snap.data()?.skillSeq as number) ?? 0) + 1;
  tx.set(ref, { skillSeq: seq }, { merge: true });
  return `SK-${new Date().getFullYear()}-${String(seq).padStart(6, '0')}`;
}

function publicName(first?: string, last?: string): string {
  const f = (first ?? '').trim();
  const l = (last ?? '').trim();
  return [f, l ? `${l[0].toUpperCase()}.` : ''].filter(Boolean).join(' ') || 'Usuario';
}

export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'usuario';
}

export async function ensurePublicSlug(userId: string, u: admin.firestore.DocumentData): Promise<string> {
  if (u.publicSlug) return u.publicSlug as string;
  const slug = `${slugify(`${u.firstName ?? ''} ${u.lastName ?? ''}`)}-${userId.slice(0, 6).toLowerCase()}`;
  await db.collection('users').doc(userId).set({ publicSlug: slug }, { merge: true });
  return slug;
}

function buildVC(skill: Skill, level: SkillLevel, code: string, issuerName: string, institutionId: string | null, isoDate: string) {
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://purl.imsglobal.org/spec/ob/v3p0/context.json'],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: `https://siercp.com/issuers/${institutionId ?? 'platform'}`, name: issuerName },
    credentialSubject: { type: 'AchievementSubject', achievement: { id: `https://siercp.com/skills/${skill.id}`, name: `${skill.name} — ${level.label}`, description: skill.description } },
    issuanceDate: isoDate,
    credentialStatus: { id: `https://siercp.com/verify/${code}`, type: '1EdTechRevocationList' },
  };
}

/** Evalúa la evidencia y otorga/actualiza skills. Idempotente. Devuelve códigos emitidos. */
export async function evaluateAndIssue(userId: string, evidence: Evidence): Promise<string[]> {
  const skills = await loadActiveSkills();
  const candidates = matchingSkills(skills, evidence);
  if (candidates.length === 0) return [];

  const u = (await db.collection('users').doc(userId).get()).data() ?? {};
  const pubName = publicName(u.firstName as string, u.lastName as string);
  const userSlug = await ensurePublicSlug(userId, u);
  const issued: string[] = [];

  for (const skill of candidates) {
    const lvl = highestLevelMet(skill, evidence.score);
    if (!lvl) continue;

    const granted = await db.runTransaction(async (tx) => {
      const id = `${userId}_${skill.id}`;
      const ref = db.doc(`userSkills/${id}`);
      const cur = await tx.get(ref);
      const c = cur.exists ? cur.data()! : null;
      if (c && (c.levelOrder as number) >= lvl.order && (c.bestScore as number) >= evidence.score) return null;

      const code = (c?.skillCode as string) ?? (await nextSkillCode(tx));
      const now = Timestamp.now();
      const instId = (skill.issuerInstitutionId as string) ?? null;
      const issuerName = skill.issuerType === 'INSTITUTION' ? (skill.issuerInstitutionId ?? 'Institución') : 'SIERCP';
      const prevEvidence = (c?.evidence as Evidence[]) ?? [];

      const userSkill = {
        id, userId, skillId: skill.id, skillName: skill.name, skillCode: code,
        level: lvl.level, levelOrder: lvl.order, issuedAt: c?.issuedAt ?? now,
        issuedByInstitutionId: instId, issuedByName: issuerName,
        evidence: [...prevEvidence, evidence].slice(-20),
        bestScore: Math.max((c?.bestScore as number) ?? 0, evidence.score),
        status: 'ACTIVE' as const,
        vc: buildVC(skill, lvl, code, issuerName, instId, now.toDate().toISOString()),
        createdAt: c?.createdAt ?? now, updatedAt: now,
      };
      tx.set(ref, userSkill, { merge: true });
      tx.set(db.doc(`skillVerifications/${code}`), {
        id: code, userSkillId: id, userId, userPublicName: pubName, userSlug,
        skillName: skill.name, level: lvl.level, institutionName: issuerName,
        issuedAt: userSkill.issuedAt, status: 'ACTIVE',
      }, { merge: true });
      return code;
    });

    if (granted) issued.push(granted);
  }

  if (issued.length > 0) {
    await recomputeUserSkillAggregates(userId);
    await recomputeBadges(userId);
  }
  return issued;
}

const XP_LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];
function calcLevel(xp: number): number {
  return XP_LEVEL_THRESHOLDS.filter((t) => xp >= t).length;
}

/**
 * Re-aloja onSessionCompleted (trigger que NO corre en Spark): actualiza stats,
 * XP, badges y leaderboard al completar una sesión. Idempotente vía
 * `sessions/{id}.statsProcessed`. Llamado por /api/skills/evaluate.
 */
export async function updateSessionStats(
  userId: string,
  sessionId: string,
  session: admin.firestore.DocumentData
): Promise<void> {
  const score = (session.metrics?.qualityScore ?? session.metrics?.score ?? 0) as number;
  const approved = (session.metrics?.approved ?? false) as boolean;
  const durationMin = ((session.duration ?? 0) as number) / 60;
  const xpGained = 15 + (approved ? 30 : 0) + (score === 100 ? 20 : 0);

  const userRef = db.collection('users').doc(userId);
  const sessRef = db.collection('sessions').doc(sessionId);

  let avgScore = 0;
  let total = 0;
  const applied = await db.runTransaction(async (tx) => {
    const [uSnap, sSnap] = await Promise.all([tx.get(userRef), tx.get(sessRef)]);
    if (sSnap.data()?.statsProcessed === true) return false; // ya procesada
    const stats = (uSnap.data()?.stats ?? {}) as Record<string, number | string[]>;
    const prevTotal = (stats.totalSessions as number) ?? 0;
    const prevAvg = (stats.averageScore as number) ?? 0;
    total = prevTotal + 1;
    avgScore = Math.round((prevAvg * prevTotal + score) / total);
    const newXp = ((stats.xp as number) ?? 0) + xpGained;
    const badges = [...((stats.badges as string[]) ?? [])];
    if (!badges.includes('first_rcp')) badges.push('first_rcp');
    if (score === 100 && !badges.includes('perfect_session')) badges.push('perfect_session');

    tx.update(userRef, {
      'stats.totalSessions': total,
      'stats.averageScore': avgScore,
      'stats.bestScore': Math.max((stats.bestScore as number) ?? 0, score),
      'stats.totalHours': FieldValue.increment(durationMin / 60),
      'stats.xp': newXp,
      'stats.level': calcLevel(newXp),
      'stats.badges': badges,
      updatedAt: Timestamp.now(),
    });
    tx.update(sessRef, { statsProcessed: true });
    return true;
  });

  if (!applied) return;

  // Leaderboard solo para usuarios con institución real.
  const u = (await userRef.get()).data() ?? {};
  const instId = u.institutionId as string | undefined;
  if (instId && instId !== userId) {
    const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || 'Usuario';
    const trend = avgScore >= 85 ? 'up' : avgScore >= 70 ? 'minus' : 'down';
    await db.doc(`leaderboards/${instId}/students/${userId}`).set(
      { uid: userId, displayName, averageScore: avgScore, totalSessions: total, trend, updatedAt: Timestamp.now() },
      { merge: true }
    );
  }
}

export async function recomputeUserSkillAggregates(userId: string): Promise<void> {
  const snap = await db.collection('userSkills').where('userId', '==', userId).where('status', '==', 'ACTIVE').get();
  const count = snap.size;
  const avgLevel = count === 0 ? 0 : snap.docs.reduce((a, d) => a + ((d.data().levelOrder as number) ?? 0), 0) / count;
  await db.collection('users').doc(userId).set({ skillsCount: count, updatedAt: Timestamp.now() }, { merge: true });
  const u = (await db.collection('users').doc(userId).get()).data() ?? {};
  const instId = u.institutionId as string | undefined;
  if (instId && instId !== userId) {
    await db.doc(`leaderboards/${instId}/students/${userId}`).set({ skillsCount: count, avgSkillLevel: Math.round(avgLevel * 10) / 10 }, { merge: true });
  }
}

export async function recomputeBadges(userId: string): Promise<void> {
  const [badgesSnap, skillsSnap] = await Promise.all([
    db.collection('badges').where('active', '==', true).get(),
    db.collection('userSkills').where('userId', '==', userId).where('status', '==', 'ACTIVE').get(),
  ]);
  if (badgesSnap.empty) return;
  const owned = new Set(skillsSnap.docs.map((d) => d.data().skillId as string));
  const now = Timestamp.now();
  const batch = db.batch();
  let writes = 0;
  for (const bDoc of badgesSnap.docs) {
    const b = bDoc.data();
    const req = b.requirement ?? {};
    let met = false;
    if (req.type === 'SKILL_SET') met = ((req.skillIds as string[]) ?? []).every((s) => owned.has(s));
    else if (req.type === 'COUNT') met = owned.size >= ((req.count as number) ?? Infinity);
    if (!met) continue;
    batch.set(db.doc(`userBadges/${userId}_${bDoc.id}`), {
      id: `${userId}_${bDoc.id}`, userId, badgeId: bDoc.id, badgeName: b.name, tier: b.tier,
      earnedAt: now, evidence: { skillIds: [...owned] }, status: 'ACTIVE',
    }, { merge: true });
    writes++;
  }
  if (writes > 0) await batch.commit();
}

export { FieldValue };
