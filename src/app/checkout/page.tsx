'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCursoBySlug, formatCOP, type Curso } from '@/data/cursos';
import Navbar from '@/components/page/Navbar';
import Footer from '@/components/page/Footer';
import CardForm, { type CardFormData } from '@/components/CardForm';
import PSEForm, { type PSEFormData } from '@/components/PSEForm';
import ResultadoModal from '@/components/ResultadoModal';
import { useWompiCheckout, type CheckoutStep } from '@/hooks/useWompiCheckout';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../landing.css';

/* ═══════════════════════════════════════════════════════════════════════════
   INDICADORES DE PROCESO DE PAGO
═══════════════════════════════════════════════════════════════════════════ */

const STEP_LABELS: Record<CheckoutStep, string> = {
  idle: '',
  tokenizing: 'Verificando tarjeta...',
  processing: 'Procesando pago...',
  verifying: 'Confirmando con el banco...',
  redirecting: 'Redirigiendo al banco...',
  enrolling: 'Registrando inscripción...',
  done: '¡Pago completado!',
  error: '',
};

/* ── Stepper visual del proceso ──────────────────────────────────────────── */
function CheckoutStepper({ step }: { step: CheckoutStep }) {
  const steps = ['Seleccionar', 'Pagar', 'Confirmar'];
  const activeIndex = step === 'idle' || step === 'tokenizing' ? 1 :
    step === 'done' ? 2 : 1;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      marginBottom: 40,
    }}>
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: i <= activeIndex ? 'linear-gradient(135deg, #1800AD, #6d4aff)' : '#E2E8F0',
              color: i <= activeIndex ? '#fff' : '#94A3B8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 14,
              transition: 'all 0.4s ease',
              boxShadow: i <= activeIndex ? '0 4px 12px rgba(24,0,173,0.25)' : 'none',
            }}>
              {i < activeIndex ? <i className="bi bi-check-lg" /> : i + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: i <= activeIndex ? '#1800AD' : '#94A3B8' }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              height: 2, flex: 1, maxWidth: 80,
              background: i < activeIndex
                ? 'linear-gradient(90deg, #1800AD, #6d4aff)'
                : '#E2E8F0',
              margin: '0 8px',
              marginBottom: 24,
              transition: 'background 0.4s ease',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Logos de métodos de pago ─────────────────────────────────────────────── */
function PaymentLogos() {
  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Medios de pago aceptados
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Visa */}
        <div style={{ background: '#1a1f71', borderRadius: 8, padding: '4px 10px', height: 30, display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 120 38" height="14" xmlns="http://www.w3.org/2000/svg">
            <path d="M46.5 2.5L30 35.5H19.5L11.5 10C11 8 10.5 7.5 9 6.5C6.5 5 2.5 3.5 0 2.5L0.5 2H17C19 2 20.5 3.5 21 5.5L25 26.5L35 2.5H46.5ZM87 2.5H98L89.5 35.5H79L87 2.5ZM67 2.5C65 2 61.5 1.5 57 1.5C45.5 1.5 37.5 7.5 37.5 16C37.5 22.5 43.5 26 48 28.5C52.5 31 54 32.5 54 34.5C54 37.5 50.5 38.5 47 38.5C42.5 38.5 40 38 36 36L34.5 35.5L33 46C36.5 47.5 43 49 49.5 49C61.5 49 69.5 43 69.5 34C69.5 27 64 23 60 21C56 19 54 17.5 54 15.5C54 13.5 56.5 11.5 61 11.5C65 11.5 67.5 12.5 69.5 13.5L70.5 14L72 3.5L67 2.5ZM103.5 2.5C101.5 2.5 100 3.5 99 5.5L81.5 35.5H93L95 29.5H108.5L109.5 35.5H120L111 2.5H103.5ZM98 21C99 18.5 102.5 9.5 102.5 9.5C102.5 9.5 103.5 6.5 104 4.5L104.5 9.5L106.5 21H98Z" fill="white" />
          </svg>
        </div>
        {/* Mastercard */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '4px 8px', height: 30, display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 38 24" height="20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="12" r="10" fill="#EB001B" />
            <circle cx="23" cy="12" r="10" fill="#F79E1B" />
            <path d="M19 5.9A10 10 0 0 1 23.5 12 10 10 0 0 1 19 18.1 10 10 0 0 1 14.5 12 10 10 0 0 1 19 5.9z" fill="#FF5F00" />
          </svg>
        </div>
        {/* PSE */}
        <div style={{ background: '#00529B', borderRadius: 8, padding: '4px 10px', height: 30, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>PSE</span>
        </div>
        {/* Nequi */}
        <div style={{ background: '#6C0099', borderRadius: 8, padding: '4px 10px', height: 30, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>nequi</span>
        </div>
        {/* Bancolombia */}
        <div style={{ background: '#FDDA24', borderRadius: 8, padding: '4px 8px', height: 30, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#1a1a1a', letterSpacing: '0.02em' }}>BANCOLOMBIA</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#94A3B8' }}>
        Procesado por <strong>Wompi</strong> · PCI-DSS Level 1 · SSL 256-bit
      </div>
    </div>
  );
}

/* ── Grid de trust badges ─────────────────────────────────────────────────── */
function TrustBadges() {
  const badges = [
    { icon: 'bi-shield-lock-fill', label: 'Pago cifrado SSL 256-bit', color: '#1800AD' },
    { icon: 'bi-credit-card-2-front-fill', label: 'PCI-DSS Level 1', color: '#16A34A' },
    { icon: 'bi-lock-fill', label: 'Datos nunca almacenados', color: '#D97706' },
    { icon: 'bi-patch-check-fill', label: 'Verificado por Wompi', color: '#7C3AED' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginTop: 16,
    }}>
      {badges.map(b => (
        <div key={b.label} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
        }}>
          <i className={`bi ${b.icon}`} style={{ color: b.color, fontSize: '1rem', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', lineHeight: 1.3 }}>
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Timeline de lo que pasa con el curso tras pagar ──────────────────────── */
function CourseTimeline({ curso }: { curso: Curso }) {
  const steps = [
    { icon: 'bi-check-circle-fill', color: '#16A34A', text: 'Pago confirmado instantáneamente', done: true },
    { icon: 'bi-envelope-check-fill', color: '#1800AD', text: 'Recibe confirmación por email con tus credenciales', done: true },
    { icon: 'bi-mortarboard-fill', color: '#7C3AED', text: 'El curso aparece en tu perfil de SIERCP', done: true },
    { icon: 'bi-unlock-fill', color: '#D97706', text: 'Acceso habilitado el día que inicia el grupo', done: false },
  ];

  return (
    <div style={{
      padding: '16px',
      background: '#F8F9FF',
      border: '1px solid rgba(24,0,173,0.1)',
      borderRadius: 16,
      marginTop: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#1800AD', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        ¿Qué pasa después de pagar?
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < steps.length - 1 ? 10 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '0.95rem' }} />
            {i < steps.length - 1 && (
              <div style={{ width: 1, flex: 1, background: '#E2E8F0', marginTop: 4, marginBottom: 4, minHeight: 12 }} />
            )}
          </div>
          <div style={{ paddingTop: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: s.done ? '#374151' : '#D97706', lineHeight: 1.4 }}>
              {s.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTENIDO PRINCIPAL DEL CHECKOUT
═══════════════════════════════════════════════════════════════════════════ */
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, initialized } = useAuth();

  const cursoSlug = searchParams.get('curso') ?? '';
  const grupoId = searchParams.get('grupo') ?? undefined;
  const cohortId = searchParams.get('cohortId') ?? searchParams.get('cohort') ?? undefined;
  const templateId = searchParams.get('templateId') ?? searchParams.get('template') ?? undefined;
  const institutionId = searchParams.get('institutionId') ?? searchParams.get('institution') ?? undefined;

  const [curso, setCurso] = useState<Curso | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PSE' | 'TRANSFER'>('CARD');
  const [cardData, setCardData] = useState<Partial<CardFormData>>({});
  const [cardValid, setCardValid] = useState(false);
  const [pseData, setPseData] = useState<Partial<PSEFormData>>({});
  const [pseValid, setPseValid] = useState(false);

  const {
    step, error, termsAccepted, setTermsAccepted, acceptancePermalink,
    loadMerchant, payWithCard, payWithPSE, isLoading,
    modalOpen, modalLoading, modalStatus, modalAmount, modalRef, closeModal,
  } = useWompiCheckout({
    cursoSlug, grupoId, cohortId, templateId, institutionId,
    amountCOP: curso?.precioCOP ?? 0,
  });

  useEffect(() => { loadMerchant(); }, [loadMerchant]);
  useEffect(() => { if (cursoSlug) setCurso(getCursoBySlug(cursoSlug)); }, [cursoSlug]);
  useEffect(() => {
    if (initialized && !user) router.push(`/formacion/${cursoSlug}`);
  }, [initialized, user, router, cursoSlug]);

  const canPay = useCallback(() => {
    if (!termsAccepted) return false;
    if (paymentMethod === 'CARD') return cardValid;
    if (paymentMethod === 'PSE') return pseValid;
    return true;
  }, [termsAccepted, paymentMethod, cardValid, pseValid]);

  const handlePayment = useCallback(async () => {
    if (!canPay() || isLoading) return;
    if (paymentMethod === 'CARD' && cardData) await payWithCard(cardData as CardFormData);
    else if (paymentMethod === 'PSE' && pseData) await payWithPSE(pseData as PSEFormData);
  }, [paymentMethod, cardData, pseData, payWithCard, payWithPSE, canPay, isLoading]);

  if (!curso) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid #E2E8F0',
          borderTop: '3px solid #1800AD',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-body">
      <Navbar forceScrolled />

      <ResultadoModal
        open={modalOpen} loading={modalLoading} status={modalStatus}
        amount={modalAmount} reference={modalRef} onClose={closeModal}
        onRetry={closeModal} onGoToCourses={() => router.push('/student/home')}
      />

      <main style={{ paddingTop: '130px', paddingBottom: '80px', background: 'var(--clr-bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

          {/* ── Stepper ──────────────────────────────────────────────────── */}
          <CheckoutStepper step={step} />

          {/* ── Encabezado ───────────────────────────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', background: 'rgba(24,0,173,0.08)',
              border: '1px solid rgba(24,0,173,0.12)', borderRadius: 100,
              fontSize: 11, fontWeight: 800, color: '#1800AD',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 16,
            }}>
              <i className="bi bi-shield-lock-fill" /> Pago 100% Seguro
            </div>
            <h1 style={{
              fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              color: 'var(--clr-text-head)', letterSpacing: '-0.03em',
              margin: '0 0 12px',
            }}>
              Finalizar Inscripción
            </h1>
            <p style={{
              color: 'var(--clr-muted)', fontSize: '1.05rem',
              maxWidth: 560, margin: '0 auto', lineHeight: 1.65,
            }}>
              Tus datos de tarjeta nunca tocan nuestros servidores —{' '}
              se cifran directamente en Wompi con certificación PCI-DSS Level 1.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 28, alignItems: 'start' }}>

            {/* ── COLUMNA IZQUIERDA: formulario de pago ─────────────────── */}
            <div>
              {/* Selector de método de pago */}
              <div style={{
                background: '#fff', border: '1px solid #E2E8F0',
                borderRadius: 20, padding: '24px',
                marginBottom: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#1800AD', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, flexShrink: 0,
                  }}>1</div>
                  Selecciona el método de pago
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {([
                    { id: 'CARD' as const, icon: 'bi-credit-card-2-front-fill', label: 'Tarjeta' },
                    { id: 'PSE' as const, icon: 'bi-bank2', label: 'PSE' },
                    { id: 'TRANSFER' as const, icon: 'bi-arrow-left-right', label: 'Transferencia' },
                  ]).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        padding: '14px 12px',
                        border: `2px solid ${paymentMethod === m.id ? '#1800AD' : '#E2E8F0'}`,
                        borderRadius: 14,
                        background: paymentMethod === m.id ? 'rgba(24,0,173,0.05)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 8,
                        boxShadow: paymentMethod === m.id ? '0 0 0 4px rgba(24,0,173,0.08)' : 'none',
                      }}
                    >
                      <i className={`bi ${m.icon}`} style={{
                        fontSize: '1.5rem',
                        color: paymentMethod === m.id ? '#1800AD' : '#94A3B8',
                        transition: 'color 0.2s ease',
                      }} />
                      <span style={{
                        fontSize: 12, fontWeight: 800,
                        color: paymentMethod === m.id ? '#1800AD' : '#64748B',
                      }}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulario según método */}
              <div style={{
                background: '#fff', border: '1px solid #E2E8F0',
                borderRadius: 20, padding: '24px',
                marginBottom: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#1800AD', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, flexShrink: 0,
                  }}>2</div>
                  Detalles del pago
                </div>

                {paymentMethod === 'CARD' && (
                  <CardForm
                    totalCOP={curso.precioCOP}
                    onChange={(data, valid) => { setCardData(data); setCardValid(valid); }}
                  />
                )}

                {paymentMethod === 'PSE' && (
                  <PSEForm
                    customerEmail={user?.email ?? ''}
                    cursoNombre={curso.nombre}
                    onChange={(data, valid) => { setPseData(data); setPseValid(valid); }}
                  />
                )}

                {paymentMethod === 'TRANSFER' && (
                  <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#1800AD' }}>
                      <i className="bi bi-info-circle-fill" style={{ fontSize: '1.1rem' }} />
                      <span style={{ fontWeight: 800, fontSize: 14 }}>Instrucciones de Transferencia</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        ['Banco', 'Bancolombia'],
                        ['Tipo de cuenta', 'Cuenta de Ahorros'],
                        ['Número de cuenta', '459-000000-01'],
                        ['Titular', 'SIERCP S.A.S'],
                        ['NIT', '900.000.000-0'],
                      ].map(([label, value]) => (
                        <div key={label} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '10px 0',
                          borderBottom: '1px solid #E2E8F0',
                          fontSize: 14,
                        }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>{label}</span>
                          <span style={{ fontWeight: 800, color: '#0F172A' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      marginTop: 16, padding: '12px 16px',
                      background: '#fff', border: '1px solid #E2E8F0',
                      borderRadius: 12, fontSize: 13,
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                    }}>
                      <i className="bi bi-whatsapp" style={{ color: '#25D366', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ color: '#374151' }}>
                        Realiza la transferencia y envía el comprobante por WhatsApp al{' '}
                        <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer"
                          style={{ fontWeight: 800, color: '#25D366', textDecoration: 'none' }}>
                          +57 300 000 0000
                        </a>. El acceso se activa en máximo 2 horas hábiles.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Aceptar términos */}
              {paymentMethod !== 'TRANSFER' && (
                <div style={{
                  background: '#fff', border: '1px solid #E2E8F0',
                  borderRadius: 20, padding: '16px 20px',
                  marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <input
                    type="checkbox"
                    id="wompi-terms"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, accentColor: '#1800AD', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <label htmlFor="wompi-terms" style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, cursor: 'pointer' }}>
                    Acepto los{' '}
                    <a
                      href={acceptancePermalink ?? 'https://wompi.com/es/terminos-y-condiciones/'}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: '#1800AD', fontWeight: 700 }}
                    >
                      términos y condiciones
                    </a>{' '}
                    del servicio de pagos de Wompi y la política de tratamiento de datos de SIERCP.
                  </label>
                </div>
              )}

              {/* Trust badges inline */}
              <TrustBadges />
            </div>

            {/* ── COLUMNA DERECHA: resumen del pedido ──────────────────── */}
            <div style={{ position: 'sticky', top: 140 }}>
              <div style={{
                background: '#fff',
                border: '1.5px solid #E2E8F0',
                borderRadius: 24,
                padding: '28px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
                  Resumen del pedido
                </div>

                {/* Card del curso */}
                <div style={{
                  background: 'linear-gradient(135deg, #1800AD, #6d4aff)',
                  borderRadius: 16, padding: '18px',
                  marginBottom: 20, position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <i className="bi bi-mortarboard-fill" style={{ color: '#fff', fontSize: '1.4rem' }} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>
                    {curso.nombre}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.15)', borderRadius: 100,
                    padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    <i className="bi bi-patch-check-fill" style={{ fontSize: '0.7rem' }} />
                    Certificado AHA 2025
                  </div>
                </div>

                {/* Desglose de precios */}
                <div style={{ marginBottom: 20 }}>
                  {[
                    { label: 'Valor del curso', value: formatCOP(curso.precioCOP) },
                    { label: 'IVA', value: 'Incluido' },
                    { label: 'Certificación', value: 'Bonificado', highlight: true },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: 10, fontSize: 14,
                    }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>{row.label}</span>
                      <span style={{
                        fontWeight: 800,
                        color: row.highlight ? '#16A34A' : '#0F172A',
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{
                  padding: '16px 0',
                  borderTop: '2px dashed #E2E8F0',
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>Total</span>
                    <span style={{
                      fontWeight: 900,
                      fontSize: 28,
                      color: '#1800AD',
                      letterSpacing: '-0.03em',
                    }}>
                      {formatCOP(curso.precioCOP)}
                    </span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: '#FEF2F2', border: '1px solid #FCA5A5',
                    borderRadius: 12, padding: '12px 16px',
                    marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8,
                    fontSize: 13,
                  }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: '#991B1B', fontWeight: 600 }}>{error}</span>
                  </div>
                )}

                {/* Botón de pago */}
                {paymentMethod === 'TRANSFER' ? (
                  <a
                    href="https://wa.me/573000000000"
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      padding: '16px 24px',
                      background: '#25D366', color: '#fff',
                      borderRadius: 16, fontWeight: 800, fontSize: 15,
                      textDecoration: 'none',
                      boxShadow: '0 8px 20px rgba(37,211,102,0.25)',
                      transition: 'all 0.25s ease',
                      width: '100%',
                    }}
                  >
                    <i className="bi bi-whatsapp" />
                    Enviar comprobante por WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={!canPay() || isLoading}
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      background: !canPay() || isLoading
                        ? '#CBD5E1'
                        : 'linear-gradient(135deg, #1800AD, #2D1FD4)',
                      color: !canPay() || isLoading ? '#94A3B8' : '#fff',
                      border: 'none', borderRadius: 16,
                      fontWeight: 900, fontSize: 16,
                      cursor: !canPay() || isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: canPay() && !isLoading ? '0 8px 24px rgba(24,0,173,0.28)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid #fff',
                          animation: 'spin 0.6s linear infinite',
                        }} />
                        {STEP_LABELS[step]}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-lock-fill" />
                        {paymentMethod === 'PSE' ? 'Continuar al banco' : 'Pagar de forma segura'}
                      </>
                    )}
                  </button>
                )}

                {/* Timeline de qué pasa después */}
                <CourseTimeline curso={curso} />

                {/* Logos de métodos de pago */}
                <PaymentLogos />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          main > div > div:last-child {
            grid-template-columns: 1fr !important;
          }
          main > div > div:last-child > div:last-child {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid #E2E8F0', borderTop: '3px solid #1800AD',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748B', fontWeight: 600, fontSize: 14 }}>Cargando checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
