import Link from 'next/link';


export function EcosistemaSiercp({ siercpUrl = '/' }: { siercpUrl?: string }) {
  return (
    <section className="bg-[#0A0A0B] text-zinc-100 rounded-3xl p-8 sm:p-12 my-12">
      <div className="max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 text-teal-400 px-3 py-1 text-xs font-semibold">
          ● Ecosistema Digital
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight">
          Parte del ecosistema <span className="text-teal-400">SICAP</span>
        </h2>
        <p className="mt-3 text-zinc-400 max-w-2xl">
          JOMAR forma parte del ecosistema SICAP: la plataforma de competencias verificadas
          respaldadas por datos de desempeño reales. Tus formaciones se traducen en Skills
          digitales verificables y un Skill Passport profesional.
        </p>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { t: 'Skills verificadas', d: 'Competencias con evidencia objetiva (telemetría AHA).' },
            { t: 'Skill Passport', d: 'Perfil público compartible en LinkedIn.' },
            { t: 'Insignias y rutas', d: 'Badges y rutas de aprendizaje gamificadas.' },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border border-zinc-800 bg-[#141416] p-4">
              <h3 className="font-semibold text-teal-400">{f.t}</h3>
              <p className="mt-1 text-sm text-zinc-400">{f.d}</p>
            </div>
          ))}
        </div>

        <Link
          href={siercpUrl}
          className="mt-8 inline-flex rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0A0A0B] font-semibold px-5 py-2.5 transition"
        >
          Conoce SIERCP →
        </Link>
      </div>
    </section>
  );
}
