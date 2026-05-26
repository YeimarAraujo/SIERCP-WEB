'use client';

/**
 * /pago/plan/confirmacion
 *
 * Shown after the user returns from Wompi's hosted payment page.
 * Reads the plan from URL params and displays status while the webhook
 * processes the payment asynchronously. Does NOT poll Firestore on the client
 * (avoids client-side Firebase SDK dependency here); instead shows a clear
 * status page with next-step instructions.
 *
 * The webhook handles all business logic server-side. This page is purely
 * informational.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/page/Navbar';
import Footer from '@/components/page/Footer';

const PLAN_LABELS: Record<string, string> = {
  pyme: 'Plan PYME',
  business: 'Plan Business',
  corporate: 'Plan Corporativo',
  enterprise: 'Plan Enterprise',
  sstSinLicencia: 'Plan SST sin Licencia',
  sstConLicencia: 'Plan SST con Licencia',
};

function ConfirmacionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = params.get('plan') ?? '';
  const planLabel = PLAN_LABELS[plan] ?? 'Plan SIERCP';

  // Recover institution name from sessionStorage if available
  const [institutionName, setInstitutionName] = useState('tu institución');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('siercp_plan_tx');
        if (stored) {
          const data = JSON.parse(stored) as { institutionName?: string };
          if (data.institutionName) setInstitutionName(data.institutionName);
          sessionStorage.removeItem('siercp_plan_tx');
        }
      } catch { /* ignore */ }
    }
    const t = setTimeout(() => setShowDetails(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: '#F0FFF4', minHeight: '100vh' }}>
      <Navbar forceScrolled />

      <main style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 600, margin: '0 auto', padding: '120px 20px 80px' }}>

        {/* Success card */}
        <div style={{
          background: '#fff', borderRadius: 24, padding: '48px 36px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)', textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg,#10B981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 40,
            boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
          }}>
            ✓
          </div>

          <div style={{
            display: 'inline-block', background: '#DCFCE7', color: '#16A34A',
            padding: '4px 14px', borderRadius: 100, fontSize: 11, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16,
          }}>
            Pago recibido
          </div>

          <h1 style={{ fontWeight: 900, fontSize: '1.9rem', color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            ¡Gracias por tu confianza!
          </h1>

          <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.7, margin: '0 0 8px' }}>
            Tu pago del <strong>{planLabel}</strong> para <strong>{institutionName}</strong> está siendo procesado.
          </p>
          <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            En los próximos minutos recibirás un email con el enlace para crear tu cuenta de administrador.
            La institución se activa automáticamente al confirmarse el pago.
          </p>

          {/* Timeline */}
          {showDetails && (
            <div style={{
              marginTop: 32, textAlign: 'left',
              background: '#F8FAFC', borderRadius: 16, padding: '20px 24px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
                ¿Qué sigue?
              </div>
              {[
                { done: true, icon: '✓', text: 'Pago recibido por Wompi', sub: 'Tu transacción fue aceptada' },
                { done: true, icon: '⚙', text: 'Activando tu institución', sub: 'Proceso automático en segundos' },
                { done: false, icon: '✉️', text: 'Email de bienvenida en camino', sub: 'Revisa tu bandeja y spam' },
                { done: false, icon: '🔑', text: 'Crea tu cuenta de administrador', sub: 'Usa el enlace del email' },
                { done: false, icon: '🚀', text: 'Invita a tu equipo', sub: 'Agrega instructores y estudiantes' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 4 ? 14 : 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: step.done ? '#10B981' : '#E2E8F0',
                    color: step.done ? '#fff' : '#94A3B8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: step.done ? 14 : 13, fontWeight: 700,
                  }}>
                    {step.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: step.done ? '#0F172A' : '#64748B' }}>
                      {step.text}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '14px 24px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#1800AD,#6d4aff)',
                color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(24,0,173,0.25)',
              }}
            >
              Volver al inicio
            </button>
            <a
              href="/contacto"
              style={{
                padding: '12px 24px', borderRadius: 12,
                border: '1.5px solid #E2E8F0', background: 'transparent',
                color: '#64748B', fontWeight: 700, fontSize: 14,
                textDecoration: 'none', display: 'block',
              }}
            >
              ¿Dudas? Escríbenos
            </a>
          </div>
        </div>

        {/* Security note */}
        <div style={{
          marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94A3B8',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
        }}>
          <span>🔒</span>
          <span>Pago procesado con cifrado SSL 256-bit por Wompi — PCI-DSS Level 1</span>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PlanConfirmacionPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0FFF4' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid #E2E8F0', borderTop: '3px solid #10B981',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}
