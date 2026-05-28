'use client';

/**
 * /tienda — SIERCP store.
 * Shows individual course purchases and institutional plan subscriptions.
 * All "buy" CTAs go through the secure checkout flow — no plan/institution
 * is created before confirmed payment.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/page/Navbar';
import Footer from '@/components/page/Footer';

// ── Data ───────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    slug: 'pyme', label: 'PYME', priceCOP: 350_000,
    desc: 'Para pequeñas empresas que quieren certificar a su equipo en RCP.',
    features: ['Hasta 25 usuarios', '2 instructores', 'Certificados básicos', 'Soporte email'],
    highlight: false,
  },
  {
    slug: 'business', label: 'Business', priceCOP: 700_000,
    desc: 'Escala tu programa de emergencias con instructores dedicados.',
    features: ['Hasta 100 usuarios', '5 instructores', 'Certificados AHA', 'Soporte prioritario'],
    highlight: true,
    badge: 'Más popular',
  },
  {
    slug: 'corporate', label: 'Corporativo', priceCOP: 1_500_000,
    desc: 'Para hospitales y corporaciones con múltiples sedes y equipos.',
    features: ['Hasta 500 usuarios', 'Instructores ilimitados', 'Certificados SST', 'Soporte dedicado'],
    highlight: false,
  },
  {
    slug: 'enterprise', label: 'Enterprise', priceCOP: 3_000_000,
    desc: 'Solución completa a escala con SLA garantizado y API propia.',
    features: ['Usuarios ilimitados', 'Multi-sede', 'API propia', 'SLA garantizado 99.9%'],
    highlight: false,
  },
] as const;

const COURSES = [
  { slug: 'rcp-basico', nombre: 'RCP Básico AHA', precioCOP: 350_000, duracion: '8 horas', cert: 'AHA BLS', icon: 'bi-heart-pulse-fill', color: '#1800AD' },
  { slug: 'primeros-auxilios', nombre: 'Primeros Auxilios', precioCOP: 280_000, duracion: '6 horas', cert: 'Cruz Roja', icon: 'bi-bandaid-fill', color: '#16A34A' },
  { slug: 'rcp-avanzado', nombre: 'RCP Avanzado ACLS', precioCOP: 680_000, duracion: '16 horas', cert: 'AHA ACLS', icon: 'bi-activity', color: '#7C3AED' },
  { slug: 'desfibrilacion', nombre: 'Desfibrilación DEA', precioCOP: 220_000, duracion: '4 horas', cert: 'AHA', icon: 'bi-lightning-charge-fill', color: '#D97706' },
] as const;

function formatCOP(n: number) {
  return `$${n.toLocaleString('es-CO')}`;
}

// ── Components ─────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: typeof PLANS[number] }) {
  const router = useRouter();
  return (
    <div style={{
      background: plan.highlight ? 'linear-gradient(135deg,#1800AD,#6d4aff)' : '#fff',
      color: plan.highlight ? '#fff' : '#0F172A',
      border: plan.highlight ? '2px solid #1800AD' : '1.5px solid #E2E8F0',
      borderRadius: 24, padding: '32px 26px', position: 'relative', overflow: 'hidden',
      transform: plan.highlight ? 'scale(1.03)' : 'none',
      boxShadow: plan.highlight ? '0 20px 60px rgba(24,0,173,0.22)' : '0 2px 12px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column',
    }}>
      {'badge' in plan && (
        <div style={{
          position: 'absolute', top: 18, right: 18,
          background: plan.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(24,0,173,0.1)',
          color: plan.highlight ? '#fff' : '#1800AD',
          padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
        }}>
          {plan.badge}
        </div>
      )}

      <h3 style={{ fontWeight: 900, fontSize: '1.3rem', margin: '0 0 6px' }}>{plan.label}</h3>
      <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 20px', lineHeight: 1.5 }}>{plan.desc}</p>

      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: '2.2rem', fontWeight: 900 }}>{formatCOP(plan.priceCOP)}</span>
        <span style={{ fontSize: 13, opacity: 0.6 }}>/mes COP</span>
      </div>

      <button
        onClick={() => router.push(`/checkout/plan?plan=${plan.slug}`)}
        style={{
          padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: plan.highlight ? '#fff' : '#1800AD',
          color: plan.highlight ? '#1800AD' : '#fff',
          fontWeight: 800, fontSize: 14, marginBottom: 20, marginTop: 8,
          transition: 'all 0.2s ease',
        }}
      >
        Contratar ahora →
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <i className="bi bi-check-circle-fill" style={{ color: plan.highlight ? '#a5f3fc' : '#10B981', flexShrink: 0 }} />
            <span style={{ opacity: 0.9 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: typeof COURSES[number] }) {
  const router = useRouter();
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 20,
      padding: '24px', display: 'flex', flexDirection: 'column',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${course.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      }}>
        <i className={`bi ${course.icon}`} style={{ color: course.color, fontSize: '1.3rem' }} />
      </div>

      <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', margin: '0 0 6px' }}>
        {course.nombre}
      </h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ background: '#F0F9FF', color: '#0369A1', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
          {course.duracion}
        </span>
        <span style={{ background: '#F0FFF4', color: '#16A34A', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
          Cert. {course.cert}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1800AD' }}>
          {formatCOP(course.precioCOP)}
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}> COP</span>
        </span>
        <button
          onClick={() => router.push(`/checkout?curso=${course.slug}`)}
          style={{
            padding: '9px 18px', borderRadius: 10, border: 'none',
            background: '#1800AD', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          Comprar →
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TiendaPage() {
  const [tab, setTab] = useState<'planes' | 'cursos'>('planes');

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <Navbar forceScrolled />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg,#1800AD,#6d4aff)', paddingTop: 100, paddingBottom: 60 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', borderRadius: 100,
            padding: '6px 18px', fontSize: 12, fontWeight: 800, color: '#fff',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20,
          }}>
            <i className="bi bi-shield-lock-fill" /> Pagos 100% seguros con Wompi
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', margin: '0 0 16px', letterSpacing: '-0.03em' }}>
            Formación en RCP para tu equipo
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', lineHeight: 1.65, maxWidth: 560, margin: '0 auto' }}>
            Planes institucionales o cursos individuales. El plan se activa inmediatamente después del pago.
          </p>
        </div>
      </section>

      {/* Tab selector */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 4 }}>
          {(['planes', 'cursos'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '16px 24px', border: 'none', cursor: 'pointer', background: 'transparent',
                fontWeight: 700, fontSize: 15,
                color: tab === t ? '#1800AD' : '#64748B',
                borderBottom: tab === t ? '2px solid #1800AD' : '2px solid transparent',
                transition: 'all 0.2s ease', textTransform: 'capitalize',
              }}
            >
              {t === 'planes' ? '🏢 Planes institucionales' : '📚 Cursos individuales'}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}>
        {tab === 'planes' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#0F172A', margin: '0 0 10px' }}>
                Planes institucionales
              </h2>
              <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>
                Tu institución y cuenta de administrador se crean después del pago confirmado.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20, alignItems: 'center',
            }}>
              {PLANS.map(plan => <PlanCard key={plan.slug} plan={plan} />)}
            </div>

            <div style={{
              marginTop: 32, padding: '16px 20px',
              background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 16,
              display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#0369A1',
            }}>
              <i className="bi bi-info-circle-fill" style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>¿Cómo funciona?</strong> Completas el formulario de compra (5 pasos, 2 minutos),
                pagas de forma segura en Wompi, y recibes un email con tu enlace de acceso.
                No creamos ninguna cuenta ni institución hasta confirmar el pago.
              </span>
            </div>
          </>
        )}

        {tab === 'cursos' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#0F172A', margin: '0 0 10px' }}>
                Cursos individuales
              </h2>
              <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>
                Compra acceso a un curso específico. Requiere cuenta SIERCP.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
            }}>
              {COURSES.map(course => <CourseCard key={course.slug} course={course} />)}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
