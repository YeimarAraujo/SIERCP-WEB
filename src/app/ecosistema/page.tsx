import { adminDb } from '@/lib/firebase-admin';
import type { Metadata } from 'next';

/**
 * Ecosistema SIERCP / Marcas Aliadas (S6).
 * Hub público del ecosistema multi-marca. Lista instituciones con showcase=true
 * (incluida JOMAR como OWNER) + marcas/proyectos asociados.
 * Cada tarjeta abre el sitio independiente correspondiente.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ecosistema SIERCP — Marcas Aliadas',
  description: 'Conoce las instituciones y marcas que forman parte del ecosistema SIERCP.',
};

interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  url: string;
  tier: string;
}

async function getBrands(): Promise<Brand[]> {
  const snap = await adminDb
    .collection('institutions')
    .where('showcase', '==', true)
    .get();

  const brands: Brand[] = snap.docs.map((d) => {
    const i = d.data();
    const cfg = (i.config ?? {}) as Record<string, unknown>;
    return {
      id: d.id,
      name: (i.name as string) ?? 'Institución',
      description: (i.description as string) ?? (cfg.tagline as string) ?? 'Institución aliada del ecosistema SIERCP.',
      category: (i.type as string) ?? 'Institución',
      logoUrl: i.logoUrl as string | undefined,
      url: (cfg.websiteUrl as string) ?? (i.brandUrl as string) ?? '#',
      tier: (i.tier as string) ?? 'PARTNER',
    };
  });

  // Ordena: OWNER primero (JOMAR), luego PARTNER, luego CLIENT.
  const rank: Record<string, number> = { OWNER: 0, PARTNER: 1, CLIENT: 2 };
  brands.sort((a, b) => (rank[a.tier] ?? 9) - (rank[b.tier] ?? 9));
  return brands;
}

export default async function EcosistemaPage() {
  const brands = await getBrands();

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-zinc-100">
      <div className="max-w-5xl mx-auto px-5 py-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 text-teal-400 px-3 py-1 text-xs font-semibold">
          ● Ecosistema multi-marca
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Ecosistema SIERCP</h1>
        <p className="mt-3 text-zinc-400 max-w-2xl">
          SIERCP es la plataforma central de competencias verificadas. Cada marca e institución aliada
          opera con identidad propia, conectada a través del ecosistema.
        </p>

        {brands.length === 0 ? (
          <p className="mt-12 text-zinc-500">Aún no hay marcas publicadas en el ecosistema.</p>
        ) : (
          <div className="mt-12 grid sm:grid-cols-2 gap-5">
            {brands.map((b) => (
              <article key={b.id} className="rounded-2xl border border-zinc-800 bg-[#141416] p-6 flex flex-col">
                <div className="flex items-center gap-4">
                  {b.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logoUrl} alt={b.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-teal-500/15 text-teal-400 grid place-items-center font-bold">
                      {b.name[0]?.toUpperCase() ?? 'S'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">{b.name}</h2>
                    <p className="text-xs text-zinc-500">{b.category}{b.tier === 'OWNER' ? ' · Marca propietaria' : ''}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-zinc-400 flex-1">{b.description}</p>
                <a
                  href={b.url}
                  target={b.url.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`mt-5 inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    b.url === '#'
                      ? 'bg-zinc-800 text-zinc-500 pointer-events-none'
                      : 'bg-teal-500 hover:bg-teal-400 text-[#0A0A0B]'
                  }`}
                >
                  {b.url === '#' ? 'Próximamente' : 'Visitar →'}
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
