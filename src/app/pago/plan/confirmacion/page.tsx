'use client';

/**
 * /pago/plan/confirmacion
 *
 * Página de regreso desde Wompi. Consulta el estado real de la transacción con
 * el `id` que agrega Wompi a la URL: nunca da un pago por aprobado sin verlo.
 * La activación del plan la hace el webhook; esta página solo informa.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Clock, X } from 'lucide-react';
import Navbar from '@/components/page/Navbar';
import Footer from '@/components/page/Footer';
import { getTransactionStatus, type WompiTransactionStatus } from '@/services/wompi.service';

const PLAN_LABELS: Record<string, string> = {
  pyme: 'Plan PYME',
  business: 'Plan Business',
  corporate: 'Plan Corporativo',
  enterprise: 'Plan Enterprise',
  sstSinLicencia: 'Plan SST sin Licencia',
  sstConLicencia: 'Plan SST con Licencia',
};

const PRODUCTS: Record<string, { label: string; approved: string; retry: string }> = {
  manikin: {
    label: 'tu pedido de maniquíes',
    approved: 'Recibimos tu pedido. Te enviaremos el comprobante por correo y te avisaremos cuando salga hacia tu dirección.',
    retry: '/checkout/manikin',
  },
  'licencia-sst': {
    label: 'tu licencia SST',
    approved: 'Tu licencia queda activa por 30 días. Te enviaremos el comprobante por correo.',
    retry: '/checkout/licencia-sst',
  },
  pack: {
    label: 'tu pack de certificados',
    approved: 'Sumaremos los certificados a tu cuenta en unos minutos. Te enviaremos el comprobante por correo.',
    retry: '/checkout/pack',
  },
};

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10;

type ViewState = 'checking' | 'approved' | 'pending' | 'failed' | 'unknown';

function toView(status: WompiTransactionStatus): ViewState {
  if (status === 'APPROVED') return 'approved';
  if (status === 'PENDING') return 'pending';
  return 'failed';
}

function ConfirmacionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = params.get('plan') ?? '';
  const transactionId = params.get('id');
  const product = PRODUCTS[params.get('type') ?? ''];
  const planLabel = product?.label ?? PLAN_LABELS[plan] ?? 'tu plan SIERCP';

  const [institutionName, setInstitutionName] = useState('tu institución');
  const [view, setView] = useState<ViewState>(transactionId ? 'checking' : 'unknown');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('siercp_plan_tx');
      if (stored) {
        const data = JSON.parse(stored) as { institutionName?: string };
        if (data.institutionName) setInstitutionName(data.institutionName);
      }
    } catch { /* el nombre es solo informativo */ }
  }, []);

  useEffect(() => {
    if (!transactionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll(attempt: number) {
      try {
        const tx = await getTransactionStatus(transactionId as string);
        if (cancelled) return;
        if (tx.status === 'PENDING' && attempt < POLL_MAX_ATTEMPTS) {
          setView('pending');
          timer = setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS);
          return;
        }
        setView(toView(tx.status));
      } catch {
        if (!cancelled) setView('unknown');
      }
    }

    poll(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [transactionId]);

  const content: Record<ViewState, { Icon: React.ElementType; color: string; bg: string; title: string; body: string }> = {
    checking: {
      Icon: Clock, color: '#64748B', bg: '#F1F5F9',
      title: 'Verificando tu pago…',
      body: 'Estamos consultando el resultado con Wompi. Esto toma unos segundos.',
    },
    approved: {
      Icon: Check, color: '#059669', bg: '#DCFCE7',
      title: '¡Pago aprobado!',
      body: product?.approved
        ?? `Estamos activando ${planLabel} para ${institutionName}. En unos minutos podrás entrar como administrador y recibirás el comprobante en tu correo.`,
    },
    pending: {
      Icon: Clock, color: '#D97706', bg: '#FEF3C7',
      title: 'Pago en proceso',
      body: 'Tu banco aún no confirma el pago. No lo repitas: te avisaremos por correo cuando se apruebe y la activación será automática.',
    },
    failed: {
      Icon: X, color: '#DC2626', bg: '#FEE2E2',
      title: 'El pago no se completó',
      body: `No se hizo ningún cargo por ${planLabel}. Puedes intentarlo de nuevo con otro medio de pago.`,
    },
    unknown: {
      Icon: Clock, color: '#64748B', bg: '#F1F5F9',
      title: 'No pudimos verificar el pago',
      body: 'Si pagaste, la activación es automática y recibirás un correo. Si no llega en unos minutos, escríbenos e indica tu referencia de Wompi.',
    },
  };

  const { Icon, color, bg, title, body } = content[view];

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <Navbar forceScrolled />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '120px 20px 80px' }}>
        <div aria-live="polite" style={{ background: '#fff', borderRadius: 24, padding: '48px 36px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Icon size={36} color={color} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: '1.9rem', color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.03em' }}>{title}</h1>
          <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.7, margin: 0 }}>{body}</p>

          <div style={{ display: 'grid', gap: 10, marginTop: 32 }}>
            {view === 'failed' ? (
              <button onClick={() => router.push(product?.retry ?? (plan ? `/checkout/plan?plan=${encodeURIComponent(plan)}` : '/planes'))} className="btn-brand w-100" style={{ padding: 14, borderRadius: 14, justifyContent: 'center' }}>
                Intentar de nuevo
              </button>
            ) : (
              <button onClick={() => router.push('/login')} disabled={view === 'checking'} className="btn-brand w-100" style={{ padding: 14, borderRadius: 14, justifyContent: 'center' }}>
                Ir a iniciar sesión
              </button>
            )}
            <button onClick={() => router.push('/')} style={{ padding: 12, borderRadius: 14, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontWeight: 700 }}>
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC' }} />}>
      <ConfirmacionContent />
    </Suspense>
  );
}
