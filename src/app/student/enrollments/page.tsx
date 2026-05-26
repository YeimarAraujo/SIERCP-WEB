'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { StudentEnrollmentService } from '@/services/student-enrollment.service';
import type { StudentCourseCard } from '@/shared/types/student-course-card';
import Link from 'next/link';
import {
  BookOpen, Calendar, ChevronRight, GraduationCap,
  ArrowRight, Award, CreditCard, Lock, AlertTriangle,
  Shield, CheckCircle2, Clock, RefreshCw,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   TIPOS INTERNOS
═══════════════════════════════════════════════════════════════════════════ */
type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'ready'; enrollments: StudentCourseCard[] };

/* ═══════════════════════════════════════════════════════════════════════════
   FORMATEADORES
═══════════════════════════════════════════════════════════════════════════ */

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCOP(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

/* ── Extrae la fecha de inicio de lockedReason ("Inicia el DD mon YYYY") ── */
function parseStartDate(reason: string | null): Date | null {
  if (!reason) return null;
  // Formato: "Inicia el 5 jun. 2026"
  const match = reason.match(/Inicia el (.+)/i);
  if (!match) return null;
  const parsed = new Date(match[1]);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOOK: COUNTDOWN PARA CURSOS BLOQUEADOS
═══════════════════════════════════════════════════════════════════════════ */
function useCountdown(targetReason: string | null) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = parseStartDate(targetReason);
    if (!target) return;

    const update = () => {
      const now = Date.now();
      const diff = target.getTime() - now;
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0 });
        setProgress(100);
        return;
      }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);

      /* Progreso basado en 30 días previos al inicio */
      const totalWindow = 30 * 86_400_000;
      const elapsed = totalWindow - diff;
      setProgress(Math.max(0, Math.min(100, (elapsed / totalWindow) * 100)));
      setRemaining({ days, hours, minutes });
    };

    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [targetReason]);

  return { remaining, progress };
}

/* ═══════════════════════════════════════════════════════════════════════════
   TARJETA DE INSCRIPCIÓN
═══════════════════════════════════════════════════════════════════════════ */
function EnrollmentCard({ card, index }: { card: StudentCourseCard; index: number }) {
  const [hovered, setHovered] = useState(false);
  const { remaining, progress } = useCountdown(card.lockedReason);
  const isLocked = card.isLocked;

  /* Colores según estado */
  const statusConfig = {
    active: { text: 'Activo', bg: '#DCFCE7', color: '#166534', icon: <CheckCircle2 size={12} /> },
    completed: { text: 'Completado', bg: '#F5F3FF', color: '#7C3AED', icon: <Award size={12} /> },
    cancelled: { text: 'Cancelado', bg: '#FEE2E2', color: '#991B1B', icon: <AlertTriangle size={12} /> },
    refunded: { text: 'Reembolsado', bg: '#FFF7ED', color: '#C2410C', icon: <RefreshCw size={12} /> },
  }[card.status] ?? { text: card.status.toUpperCase(), bg: '#F1F5F9', color: '#475569', icon: null };

  return (
    <div
      style={{
        background: isLocked ? '#FAFBFF' : '#FFFFFF',
        border: `1.5px solid ${hovered && !isLocked ? '#1800AD' : isLocked ? '#E2E8F0' : '#E2E8F0'}`,
        borderRadius: 24,
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered && !isLocked ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && !isLocked
          ? '0 20px 40px -12px rgba(24,0,173,0.14)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        cursor: isLocked ? 'default' : 'pointer',
        /* Animación de entrada escalonada */
        animation: `enrollReveal 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 0.08}s both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Franja de estado superior (para cursos bloqueados: naranja) ── */}
      {isLocked && (
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
        }} />
      )}
      {!isLocked && (
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, #1800AD, #6d4aff)',
        }} />
      )}

      <div style={{ padding: '24px' }}>
        {/* ── Fila superior: icono + título + estado ────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0, flex: 1 }}>
            {/* Icono del curso */}
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: isLocked
                ? 'linear-gradient(135deg, #E2E8F0, #CBD5E1)'
                : 'linear-gradient(135deg, #1800AD, #6d4aff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isLocked
                ? 'none'
                : '0 8px 16px rgba(24,0,173,0.25)',
            }}>
              {isLocked
                ? <Lock size={22} color="#64748B" />
                : <BookOpen size={22} color="#fff" />
              }
            </div>

            {/* Título + razón de bloqueo o instructor */}
            <div style={{ minWidth: 0 }}>
              <h4 style={{
                fontSize: 15, fontWeight: 800, color: '#0F172A',
                margin: 0, lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {card.title}
              </h4>
              <div style={{ fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                {isLocked
                  ? <>
                      <Clock size={11} color="#F59E0B" />
                      <span style={{ color: '#D97706', fontWeight: 700 }}>
                        {card.lockedReason ?? 'Próximamente disponible'}
                      </span>
                    </>
                  : <>
                      <Shield size={11} color="#6d4aff" />
                      <span style={{ color: '#64748B', fontWeight: 600 }}>
                        {card.instructorName}
                      </span>
                    </>
                }
              </div>
            </div>
          </div>

          {/* Badge de estado */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 10, fontWeight: 900,
            padding: '4px 12px', borderRadius: 20,
            background: isLocked ? '#FFF7ED' : statusConfig.bg,
            color: isLocked ? '#D97706' : statusConfig.color,
            letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {isLocked ? <Lock size={10} /> : statusConfig.icon}
            {isLocked ? 'BLOQUEADO' : statusConfig.text}
          </span>
        </div>

        {/* ── COUNTDOWN para cursos bloqueados ──────────────────────────── */}
        {isLocked && remaining && (
          <div style={{
            background: 'linear-gradient(135deg, #FFF7ED, #FFF3E0)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, color: '#92400E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Disponible en
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {[
                { value: remaining.days, label: 'días' },
                { value: remaining.hours, label: 'horas' },
                { value: remaining.minutes, label: 'min' },
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{
                    background: '#fff',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 10,
                    padding: '6px 12px',
                    fontSize: 20, fontWeight: 900, color: '#1800AD',
                    lineHeight: 1, minWidth: 48,
                  }}>
                    {String(value).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 10, color: '#92400E', fontWeight: 700, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            {/* Barra de progreso hacia la fecha de inicio */}
            <div style={{ height: 4, background: 'rgba(245,158,11,0.2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* ── Grid de metadatos del pago ─────────────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
          background: '#F8FAFC', borderRadius: 12, padding: '12px 14px',
          marginBottom: 16,
        }}>
          {[
            {
              icon: <Calendar size={12} style={{ color: '#94A3B8' }} />,
              label: 'INSCRITO',
              value: formatDate(card.enrolledAt),
            },
            {
              icon: <CreditCard size={12} style={{ color: '#94A3B8' }} />,
              label: 'PAGADO',
              value: formatCOP(card.amountPaid),
            },
            {
              icon: <Award size={12} style={{ color: '#94A3B8' }} />,
              label: 'MÉTODO',
              value: card.paymentMethod ?? '—',
            },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {icon}
              <div>
                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 2 }}>
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA de acción ─────────────────────────────────────────────── */}
        {isLocked ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px',
            background: '#F1F5F9',
            borderRadius: 12,
            fontSize: 13, fontWeight: 700, color: '#64748B',
          }}>
            <Lock size={14} />
            <span>El acceso se habilitará automáticamente en la fecha de inicio</span>
          </div>
        ) : (
          <Link
            href={card.href}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'linear-gradient(135deg, #1800AD, #2D1FD4)',
              color: '#fff',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 12px rgba(24,0,173,0.2)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(24,0,173,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(24,0,173,0.2)'; }}
          >
            <span>Ir al curso</span>
            <ChevronRight size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETON LOADER
═══════════════════════════════════════════════════════════════════════════ */
function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          borderRadius: 24, overflow: 'hidden',
          border: '1px solid #E2E8F0',
          background: '#fff',
          animation: 'skeletonPulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ height: 4, background: '#E2E8F0' }} />
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#E2E8F0' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 16, background: '#E2E8F0', borderRadius: 6, marginBottom: 8, width: '70%' }} />
                <div style={{ height: 12, background: '#F1F5F9', borderRadius: 6, width: '45%' }} />
              </div>
            </div>
            <div style={{ height: 72, background: '#F8FAFC', borderRadius: 12, marginBottom: 16 }} />
            <div style={{ height: 46, background: '#E2E8F0', borderRadius: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ESTADO VACÍO
═══════════════════════════════════════════════════════════════════════════ */
function EmptyState() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #F8F9FF, #EEF0FF)',
      border: '1.5px solid rgba(24,0,173,0.1)',
      borderRadius: 28,
      padding: '72px 32px',
      textAlign: 'center',
      maxWidth: 560,
      margin: '32px auto',
    }}>
      {/* Icono animado */}
      <div style={{
        width: 88, height: 88, borderRadius: 24,
        background: 'linear-gradient(135deg, #1800AD, #6d4aff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 16px 32px rgba(24,0,173,0.25)',
        animation: 'floatBadge 4s ease-in-out infinite',
      }}>
        <GraduationCap size={40} color="#fff" />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>
        Sin inscripciones activas
      </h3>
      <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.65, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
        Aún no tienes cursos inscritos. Explora nuestro catálogo y comienza tu formación con estándares AHA 2025.
      </p>
      <Link
        href="/programas"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 28px',
          background: 'linear-gradient(135deg, #1800AD, #2D1FD4)',
          color: '#fff',
          borderRadius: 14, fontWeight: 800, textDecoration: 'none',
          boxShadow: '0 8px 20px rgba(24,0,173,0.25)',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        Explorar cursos <ArrowRight size={18} />
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ESTADO DE ERROR
═══════════════════════════════════════════════════════════════════════════ */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      background: '#FFF7ED',
      border: '1.5px solid #FED7AA',
      borderRadius: 24,
      padding: '48px 32px',
      textAlign: 'center',
      maxWidth: 560,
      margin: '32px auto',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: '#fff', border: '1px solid #FED7AA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#EA580C', margin: '0 auto 20px',
      }}>
        <AlertTriangle size={30} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#9A3412', marginBottom: 8 }}>
        Error al cargar inscripciones
      </h3>
      <p style={{ color: '#C2410C', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px',
          background: '#EA580C', color: '#fff',
          borderRadius: 10, fontWeight: 700, border: 'none',
          cursor: 'pointer', fontSize: 14,
        }}
      >
        <RefreshCw size={15} /> Reintentar
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export default function StudentEnrollmentsPage() {
  const { user } = useAuth();
  const [state, setState] = useState<PageState>({ kind: 'loading' });

  const load = useCallback(async () => {
    if (!user) return;
    setState({ kind: 'loading' });
    try {
      const enrollments = await StudentEnrollmentService.getPlatformEnrollmentsWithLockState(user.uid);
      setState(
        enrollments.length === 0
          ? { kind: 'empty' }
          : { kind: 'ready', enrollments },
      );
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error
          ? err.message
          : 'No se pudo cargar tus inscripciones. Intenta nuevamente.',
      });
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const locked = state.kind === 'ready' ? state.enrollments.filter(e => e.isLocked).length : 0;
  const total = state.kind === 'ready' ? state.enrollments.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
      <Header title="Mis Inscripciones" />

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* ── Encabezado premium ──────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1800AD 0%, #2D1FD4 60%, #6d4aff 100%)',
          borderRadius: 24,
          padding: '32px 36px',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Orbs decorativos */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 80, width: 120, height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 100, padding: '4px 12px',
                  fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 12,
                }}>
                  <Shield size={11} /> Portal del Estudiante
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                  Mis Inscripciones
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  {total > 0
                    ? `${total} programa${total !== 1 ? 's' : ''} matriculado${total !== 1 ? 's' : ''}${locked > 0 ? ` · ${locked} pendiente${locked !== 1 ? 's' : ''} de inicio` : ''}`
                    : 'Aquí aparecerán tus programas de formación tras inscribirte.'
                  }
                </p>
              </div>

              {/* Stat cards */}
              {total > 0 && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 16, padding: '14px 18px', textAlign: 'center',
                    backdropFilter: 'blur(10px)',
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{total}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Total</div>
                  </div>
                  {locked > 0 && (
                    <div style={{
                      background: 'rgba(245,158,11,0.2)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 16, padding: '14px 18px', textAlign: 'center',
                      backdropFilter: 'blur(10px)',
                    }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#FCD34D', lineHeight: 1 }}>{locked}</div>
                      <div style={{ fontSize: 10, color: 'rgba(252,211,77,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Próximos</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Info sobre el sistema de bloqueo ──────────────────────────── */}
        {state.kind === 'ready' && locked > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: '#FFFBEB',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 16, padding: '14px 18px',
            marginBottom: 24,
          }}>
            <Clock size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#92400E', marginBottom: 3 }}>
                Cursos pendientes de inicio
              </div>
              <div style={{ fontSize: 13, color: '#B45309', lineHeight: 1.5 }}>
                Tu inscripción está confirmada. El acceso al contenido se habilitará automáticamente el día que inicie el curso. Puedes ver la fecha de inicio en cada tarjeta.
              </div>
            </div>
          </div>
        )}

        {/* ── Contenido según estado ─────────────────────────────────────── */}
        {state.kind === 'loading' && <SkeletonGrid />}
        {state.kind === 'error' && <ErrorState message={state.message} onRetry={load} />}
        {state.kind === 'empty' && <EmptyState />}

        {state.kind === 'ready' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 20,
          }}>
            {state.enrollments.map((card, i) => (
              <EnrollmentCard key={card.id} card={card} index={i} />
            ))}
          </div>
        )}

        {/* ── CTA para explorar más cursos ──────────────────────────────── */}
        {state.kind === 'ready' && (
          <div style={{
            marginTop: 32,
            padding: '20px 24px',
            background: '#fff',
            border: '1.5px solid #E2E8F0',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(24,0,173,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GraduationCap size={20} style={{ color: '#1800AD' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                  ¿Quieres seguir aprendiendo?
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  Explora más cursos con certificación AHA 2025
                </div>
              </div>
            </div>
            <Link
              href="/programas"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                background: '#1800AD', color: '#fff',
                borderRadius: 12, fontWeight: 700, textDecoration: 'none',
                fontSize: 14, whiteSpace: 'nowrap',
              }}
            >
              Ver más cursos <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes enrollReveal {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
