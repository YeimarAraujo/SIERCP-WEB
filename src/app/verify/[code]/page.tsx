import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';

/**
 * Verificación pública de Skill — /verify/{code}  (S2)
 * Lee skillVerifications/{code} (doc denormalizado, sin PII sensible).
 * Página para reclutadores: sin auth.
 */

export const dynamic = 'force-dynamic';

interface VerificationData {
  skillName: string;
  level: string;
  institutionName: string;
  userPublicName: string;
  userSlug?: string;
  status: 'ACTIVE' | 'REVOKED';
  issuedAt?: { toDate: () => Date };
}

async function getVerification(code: string): Promise<VerificationData | null> {
  if (!/^SK-\d{4}-\d{6}$/.test(code)) return null;
  const snap = await adminDb.doc(`skillVerifications/${code}`).get();
  return snap.exists ? (snap.data() as VerificationData) : null;
}

const LEVEL_LABEL: Record<string, string> = {
  BASICO: 'Básico', INTERMEDIO: 'Intermedio', AVANZADO: 'Avanzado', PROFESIONAL: 'Profesional',
};

export default async function VerifySkillPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const data = await getVerification(code);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-zinc-100 p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-[#141416] p-8 text-center">
          <div className="text-5xl mb-4">❓</div>
          <h1 className="text-xl font-semibold">Competencia no encontrada</h1>
          <p className="mt-2 text-zinc-400">El código <code className="text-teal-400">{code}</code> no corresponde a ninguna skill verificada.</p>
        </div>
      </main>
    );
  }

  const revoked = data.status === 'REVOKED';
  const issued = data.issuedAt?.toDate ? data.issuedAt.toDate() : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-zinc-100 p-6">
      <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-[#141416] p-8">
        <div className="flex items-center gap-2 text-sm">
          {revoked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-400 px-3 py-1">● Revocada</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 px-3 py-1">✓ Verificada</span>
          )}
          <span className="ml-auto font-mono text-zinc-500">{code}</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold leading-tight">{data.skillName}</h1>
        <p className="mt-1 text-teal-400 font-medium">Nivel {LEVEL_LABEL[data.level] ?? data.level}</p>

        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Titular" value={data.userPublicName} />
          <Row label="Institución emisora" value={data.institutionName} />
          {issued && <Row label="Fecha de emisión" value={issued.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })} />}
        </dl>

        {data.userSlug && !revoked && (
          <Link href={`/u/${data.userSlug}`} className="mt-6 block text-center rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0A0A0B] font-semibold py-2.5 transition">
            Ver perfil profesional
          </Link>
        )}

        <p className="mt-6 text-xs text-zinc-600 text-center">
          Competencia verificada por SIERCP — respaldada por datos de desempeño reales.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-zinc-800/60 pb-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-200 text-right">{value}</dd>
    </div>
  );
}
