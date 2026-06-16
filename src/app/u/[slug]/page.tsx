import { adminDb } from '@/lib/firebase-admin';
import type { Metadata } from 'next';
import Link from 'next/link';

/**
 * Skill Passport público — /u/{slug}  (S3)
 * SEO-friendly. Solo visible si el usuario activó publicProfile (opt-in).
 * Sirve también como Employer View (score, skills, evidencias, ranking, fecha).
 */

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com';

const LEVEL_LABEL: Record<string, string> = {
  BASICO: 'Básico', INTERMEDIO: 'Intermedio', AVANZADO: 'Avanzado', PROFESIONAL: 'Profesional',
};

interface PublicProfile {
  uid: string;
  firstName?: string; lastName?: string; avatarUrl?: string;
  institutionId?: string; skillsCount?: number;
  stats?: { level?: number; totalSessions?: number; averageScore?: number };
}
interface PublicSkill {
  skillCode: string; skillName: string; level: string; levelOrder: number;
  bestScore: number; issuedByName: string; issuedAt?: { toDate: () => Date };
}
interface PublicBadge { badgeName: string; tier: string }

async function getProfile(slug: string): Promise<{ profile: PublicProfile; institutionName: string; skills: PublicSkill[]; badges: PublicBadge[] } | null> {
  const q = await adminDb.collection('users')
    .where('publicSlug', '==', slug).where('publicProfile', '==', true).limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0];
  const profile = { uid: doc.id, ...(doc.data() as Omit<PublicProfile, 'uid'>) };

  const [skillsSnap, badgesSnap, instSnap] = await Promise.all([
    adminDb.collection('userSkills').where('userId', '==', doc.id).where('status', '==', 'ACTIVE').orderBy('issuedAt', 'desc').get(),
    adminDb.collection('userBadges').where('userId', '==', doc.id).where('status', '==', 'ACTIVE').get(),
    profile.institutionId ? adminDb.collection('institutions').doc(profile.institutionId).get() : Promise.resolve(null),
  ]);

  return {
    profile,
    institutionName: (instSnap?.data()?.name as string) ?? 'SIERCP',
    skills: skillsSnap.docs.map((d) => d.data() as PublicSkill),
    badges: badgesSnap.docs.map((d) => d.data() as PublicBadge),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProfile(slug);
  if (!data) return { title: 'Perfil no encontrado · SIERCP' };
  const name = `${data.profile.firstName ?? ''} ${data.profile.lastName ?? ''}`.trim();
  const title = `${name} — Competencias verificadas · SIERCP`;
  const description = `${data.skills.length} skills verificadas, ${data.badges.length} insignias. Competencias respaldadas por datos de desempeño reales.`;
  return {
    title, description,
    openGraph: { title, description, url: `${APP_URL}/u/${slug}`, type: 'profile' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function PublicPassportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProfile(slug);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-zinc-100 p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-[#141416] p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold">Perfil no disponible</h1>
          <p className="mt-2 text-zinc-400">Este perfil no existe o es privado.</p>
        </div>
      </main>
    );
  }

  const { profile, institutionName, skills, badges } = data;
  const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Profesional';
  const initials = ((profile.firstName?.[0] ?? '') + (profile.lastName?.[0] ?? '')).toUpperCase() || 'U';
  const profileUrl = `${APP_URL}/u/${slug}`;
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-zinc-100">
      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Hero */}
        <header className="flex items-center gap-5">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={name} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-teal-500/15 text-teal-400 grid place-items-center text-2xl font-bold">{initials}</div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{name}</h1>
            <p className="text-zinc-400">{institutionName}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Stat label="Nivel" value={`${profile.stats?.level ?? 1}`} />
              <Stat label="Skills" value={`${skills.length}`} />
              <Stat label="Insignias" value={`${badges.length}`} />
              {typeof profile.stats?.averageScore === 'number' && <Stat label="Score prom." value={`${profile.stats.averageScore}`} />}
            </div>
          </div>
        </header>

        {/* LinkedIn share */}
        <a href={shareUrl} target="_blank" rel="noopener noreferrer"
           className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] hover:bg-[#0a5cad] text-white text-sm font-semibold px-4 py-2 transition">
          in · Compartir en LinkedIn
        </a>

        {/* Badges */}
        {badges.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">Insignias</h2>
            <div className="flex flex-wrap gap-3">
              {badges.map((b, i) => (
                <span key={i} className={`rounded-full px-3 py-1.5 text-sm font-medium ${tierClass(b.tier)}`}>● {b.badgeName}</span>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">Competencias verificadas</h2>
          {skills.length === 0 ? (
            <p className="text-zinc-500">Aún sin competencias verificadas.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {skills.map((s) => {
                const verifyUrl = `${APP_URL}/verify/${s.skillCode}`;
                const addToLinkedIn =
                  `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME` +
                  `&name=${encodeURIComponent(`${s.skillName} (${LEVEL_LABEL[s.level] ?? s.level})`)}` +
                  `&organizationName=SIERCP&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(s.skillCode)}`;
                return (
                  <div key={s.skillCode} className="rounded-xl border border-zinc-800 bg-[#141416] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight">{s.skillName}</h3>
                        <p className="text-teal-400 text-sm mt-0.5">Nivel {LEVEL_LABEL[s.level] ?? s.level}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1">✓ {Math.round(s.bestScore)}</span>
                    </div>
                    <p className="mt-2 text-xs font-mono text-zinc-600">{s.skillCode}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Link href={`/verify/${s.skillCode}`} className="rounded-md bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 transition">Verificar</Link>
                      <a href={addToLinkedIn} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#0A66C2] hover:bg-[#0a5cad] text-white px-3 py-1.5 transition">Añadir a LinkedIn</a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-12 pt-6 border-t border-zinc-800/60 text-xs text-zinc-600">
          Competencias verificadas por SIERCP — respaldadas por datos de desempeño reales (Open Badges 3.0).
        </footer>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-zinc-800/60 px-2.5 py-1">
      <span className="text-zinc-500">{label} </span><span className="font-semibold text-zinc-100">{value}</span>
    </span>
  );
}

function tierClass(tier: string): string {
  switch (tier) {
    case 'GOLD': return 'bg-amber-500/10 text-amber-400';
    case 'SILVER': return 'bg-zinc-400/10 text-zinc-300';
    default: return 'bg-orange-700/10 text-orange-400';
  }
}
