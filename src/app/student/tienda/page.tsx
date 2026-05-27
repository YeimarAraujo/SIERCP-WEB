'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import {
    ShoppingBag, ShieldCheck, Package, BookOpen, ChevronRight,
    CheckCircle2, Lock, Award,
} from 'lucide-react';
import { sstConLicenciaPlans, sstSinLicenciaPlans } from '@/data/planes';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(n: number) {
    return `$${n.toLocaleString('es-CO')} COP`;
}

// ── Access status card ────────────────────────────────────────────────────────

function AccessCard({ role }: { role: string }) {
    const hasSSTLicense = role === 'USUARIO_SST';
    const isProfessional = role === 'USUARIO_PROFESIONAL';

    const features = [
        { label: 'Acceso a cursos gratuitos', enabled: true },
        { label: 'Historial de sesiones', enabled: true },
        { label: 'Certificados básicos', enabled: true },
        { label: 'Licencia SST activa', enabled: hasSSTLicense },
        { label: 'Certificados ilimitados', enabled: hasSSTLicense },
        { label: 'Cursos profesionales (10)', enabled: isProfessional || hasSSTLicense },
        { label: 'Reportes avanzados', enabled: isProfessional || hasSSTLicense },
    ];

    const roleLabel: Record<string, { name: string; color: string }> = {
        USUARIO: { name: 'Básico', color: '#64748b' },
        USUARIO_PROFESIONAL: { name: 'Profesional', color: '#6366f1' },
        USUARIO_SST: { name: 'SST', color: '#10b981' },
        INSTRUCTOR: { name: 'Instructor', color: '#0ea5e9' },
    };
    const meta = roleLabel[role] ?? roleLabel.USUARIO;

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 18, background: 'var(--bg-surface)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Acceso actual</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>Plan {meta.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: `${meta.color}18`, color: meta.color, textTransform: 'uppercase' }}>ACTIVO</span>
                    </div>
                </div>
                <Award size={32} color={meta.color} strokeWidth={1.5} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
                {features.map(f => (
                    <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        {f.enabled
                            ? <CheckCircle2 size={14} color="#10b981" />
                            : <Lock size={14} color="#94a3b8" />}
                        <span style={{ color: f.enabled ? 'var(--text-secondary)' : 'var(--text-muted)', textDecoration: f.enabled ? 'none' : 'none' }}>{f.label}</span>
                    </div>
                ))}
            </div>
            {!hasSSTLicense && (
                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#6366f1', fontWeight: 600 }}>
                        Adquiere una licencia SST o un pack de certificados para certificar a tus alumnos.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ name, desc, price, badge, highlight, href, isContact, tag }: {
    name: string; desc: string; price: string; badge?: string | null;
    highlight?: boolean; href: string; isContact?: boolean; tag?: string;
}) {
    const router = useRouter();
    return (
        <div style={{
            border: `1px solid ${highlight ? 'var(--brand)' : 'var(--border)'}`,
            borderRadius: 14, background: 'var(--bg-surface)', padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 10,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                    {tag && <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{tag}</div>}
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                </div>
                {badge && (
                    <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 20, background: highlight ? 'var(--brand)' : 'var(--bg-surface-2)', color: highlight ? '#fff' : 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{badge}</span>
                )}
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)' }}>{price}</div>
            <button
                onClick={() => router.push(href)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--bg-surface-2)', color: 'var(--text-primary)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
                {isContact ? 'Solicitar información' : 'Obtener ahora'}
                <ChevronRight size={14} />
            </button>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentTiendaPage() {
    const user = useAuthStore(s => s.user);
    const role = user?.role ?? 'USUARIO';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            {/* Header */}
            <Header />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <PageHero
                    title="Tienda"
                    subtitle="Mejora tu acceso, obtén certificados y amplía tus capacidades en la plataforma."
                    parentTitle="Estudiante"
                    parentHref="/student/dashboard"
                />

                <div style={{ display: 'grid', gap: 28, maxWidth: 700, margin: '0 auto' }}>
                    {/* Access status */}
                    <AccessCard role={role} />

                    {/* SST con licencia */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <ShieldCheck size={16} color="var(--text-muted)" />
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>Licencias SST</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Suscripción mensual · Certificados incluidos · Acceso completo</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                            {sstConLicenciaPlans.map(p => (
                                <ProductCard
                                    key={p.slug}
                                    name={p.name}
                                    desc={p.desc}
                                    price={`${formatCOP(p.monthlyCOP)}/mes`}
                                    badge={p.badge}
                                    highlight={p.highlight}
                                    href={`/checkout/licencia-sst?plan=${p.slug}`}
                                    tag="Licencia SST"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Packs sin licencia */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <Package size={16} color="var(--text-muted)" />
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>Packs de certificados</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pago único · Sin suscripción · Ideal para certificar puntualmente</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                            {sstSinLicenciaPlans.map(p => (
                                <ProductCard
                                    key={p.slug}
                                    name={p.name}
                                    desc={p.desc}
                                    price={formatCOP(p.monthlyCOP)}
                                    badge={p.badge}
                                    highlight={p.highlight}
                                    href={`/checkout/pack?pack=${p.slug}`}
                                    tag="Pago único"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
