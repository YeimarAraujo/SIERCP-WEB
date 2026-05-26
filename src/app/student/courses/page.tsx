'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { StudentEnrollmentService } from '@/services/student-enrollment.service';
import type { StudentCourseCard } from '@/shared/types/student-course-card';
import Link from 'next/link';
import {
  BookOpen, Users, ChevronRight, GraduationCap, ArrowRight,
  Lock, Building2, AlertTriangle, Shield, RefreshCw, Search, Plus,
} from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'ready'; courses: StudentCourseCard[] };

function CourseCard({ card, index }: { card: StudentCourseCard; index: number }) {
  const [hovered, setHovered] = useState(false);
  const isLocked = card.isLocked;

  const inner = (
    <div
      style={{
        background: isLocked ? '#FAFBFF' : 'var(--card)',
        border: `1.5px solid ${hovered && !isLocked ? '#1800AD' : 'var(--border)'}`,
        borderRadius: 24,
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered && !isLocked ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && !isLocked
          ? '0 20px 40px -12px rgba(24,0,173,0.14)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        cursor: isLocked ? 'default' : 'pointer',
        animation: `courseReveal 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 0.07}s both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Franja superior */}
      <div style={{
        height: 4,
        background: isLocked
          ? 'linear-gradient(90deg, #94A3B8, #CBD5E1)'
          : 'none',
      }} />

      <div style={{ padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        {/* Icono + info */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0, flex: 1 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14, flexShrink: 0,
            background: isLocked
              ? 'linear-gradient(135deg, #E2E8F0, #CBD5E1)'
              : 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isLocked
              ? <Lock size={20} color="#64748B" />
              : <BookOpen size={20} color="#fff" />
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{
              fontSize: 15, fontWeight: 800, color: 'var(--text-primary)',
              margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {card.title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {isLocked ? (
                <span style={{ fontSize: 12, color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={11} /> {card.lockedReason ?? 'Próximamente'}
                </span>
              ) : (
                <>
                  {card.source === 'legacy' && (
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} /> {card.studentCount} participantes
                    </span>
                  )}
                  {card.source === 'platform' && (
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={12} /> {card.instructorName}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Badge + flecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20,
            background: isLocked ? '#FFF7ED' : 'var(--success-bg)',
            color: isLocked ? '#D97706' : 'var(--success-text)',
            letterSpacing: '0.04em', whiteSpace: 'nowrap',
          }}>
            {isLocked ? 'BLOQUEADO' : 'ACTIVO'}
          </span>
          {!isLocked && (
            <div style={{
              width: 30, height: 30, borderRadius: 10,
              background: hovered ? '#1800AD' : 'var(--card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}>
              <ChevronRight size={16} style={{ color: hovered ? '#fff' : '#94A3B8' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLocked) return <div>{inner}</div>;
  return <Link href={card.href} style={{ textDecoration: 'none' }}>{inner}</Link>;
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          borderRadius: 24, overflow: 'hidden', border: '1px solid #E2E8F0',
          background: '#fff', animation: 'skeletonPulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ height: 4, background: '#E2E8F0' }} />
          <div style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: '#E2E8F0' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, background: '#E2E8F0', borderRadius: 6, marginBottom: 8, width: '65%' }} />
              <div style={{ height: 11, background: '#F1F5F9', borderRadius: 6, width: '40%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #F8F9FF, #EEF0FF)',
      border: '1.5px solid rgba(24,0,173,0.1)',
      borderRadius: 28, padding: '72px 32px',
      textAlign: 'center', maxWidth: 560, margin: '32px auto',
    }}>
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
        Sin cursos activos
      </h3>
      <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.65, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
        Aún no estás inscrito en ningún curso. Contacta a tu instructor o explora el catálogo de programas.
      </p>
      <Link
        href="/programas"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 28px',
          background: 'linear-gradient(135deg, #1800AD, #2D1FD4)',
          color: '#fff', borderRadius: 14, fontWeight: 800, textDecoration: 'none',
          boxShadow: '0 8px 20px rgba(24,0,173,0.25)',
        }}
      >
        Explorar cursos <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      background: '#FFF7ED', border: '1.5px solid #FED7AA',
      borderRadius: 24, padding: '48px 32px',
      textAlign: 'center', maxWidth: 560, margin: '32px auto',
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
        Error al cargar cursos
      </h3>
      <p style={{ color: '#C2410C', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: '#EA580C', color: '#fff',
          borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14,
        }}
      >
        <RefreshCw size={15} /> Reintentar
      </button>
    </div>
  );
}

export default function StudentCoursesPage() {
  const { user, coursesLeft } = useAuth();
  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [search, setSearch] = useState('');
  const coursesCreated = user?.coursesCreated ?? 0;
  const LIMIT = 3;

  const load = useCallback(async () => {
    if (!user) return;
    setState({ kind: 'loading' });
    try {
      const courses = await StudentEnrollmentService.getStudentCourses(user.uid);
      setState(courses.length === 0 ? { kind: 'empty' } : { kind: 'ready', courses });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'No se pudo conectar con el servidor.',
      });
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = state.kind === 'ready'
    ? state.courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : [];

  const total = state.kind === 'ready' ? state.courses.length : 0;
  const locked = state.kind === 'ready' ? state.courses.filter(c => c.isLocked).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
      <Header title="Mis Cursos" />

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <PageHero
          title="Mis Cursos"
          subtitle={total > 0
            ? `${total} programa${total !== 1 ? 's' : ''} matriculado${total !== 1 ? 's' : ''}${locked > 0 ? ` · ${locked} pendiente${locked !== 1 ? 's' : ''} de inicio` : ''}`
            : 'Programas de capacitación clínica con estándares AHA 2025.'
          }
          parentTitle="Inicio"
          parentHref="/student/home"
          actions={<>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Create button */}
              <Link
                href="/student/courses/create"
                style={{
                  padding: '10px 18px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: coursesLeft > 0 ? 'var(--card)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${coursesLeft > 0 ? 'var(--brand)' : 'rgba(255,255,255,0.12)'}`,
                  color: coursesLeft > 0 ? 'var(--brand)' : 'rgba(255,255,255,0.4)',
                  pointerEvents: coursesLeft === 0 ? 'none' : 'auto',
                  textDecoration: 'none',
                }}
              >
                <Plus size={16} /> Crear curso
              </Link>
              {/* Quota chip
              <div style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 16, padding: '14px 18px', textAlign: 'center', backdropFilter: 'blur(10px)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{coursesCreated}/{LIMIT}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                  {coursesLeft > 0 ? `${coursesLeft} libre${coursesLeft !== 1 ? 's' : ''}` : 'Sin cupo'}
                </div>
              </div>

              {total > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 16, padding: '14px 18px', textAlign: 'center', backdropFilter: 'blur(10px)',
                }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{total}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Total</div>
                </div>
              )}
              {total > 0 && locked > 0 && (
                <div style={{
                  background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 16, padding: '14px 18px', textAlign: 'center', backdropFilter: 'blur(10px)',
                }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#FCD34D', lineHeight: 1 }}>{locked}</div>
                  <div style={{ fontSize: 10, color: 'rgba(252,211,77,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Próximos</div>
                </div>
              )} */}
            </div></>}
        />

        {/* ── Buscador ─────────────────────────────────────────────────── */}
        {state.kind === 'ready' && (
          <div style={{ position: 'relative', maxWidth: 400, flex: 1, marginBottom: 22 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar curso..."
              style={{
                width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid var(--border)',
                fontSize: 14, outline: 'none', background: 'var(--muted)'
              }}
            />
          </div>
        )}

        {/* ── Contenido ────────────────────────────────────────────────── */}
        {state.kind === 'loading' && <SkeletonGrid />}
        {state.kind === 'error' && <ErrorState message={state.message} onRetry={load} />}
        {state.kind === 'empty' && <EmptyState />}

        {state.kind === 'ready' && filtered.length === 0 && search && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
            Sin resultados para &ldquo;{search}&rdquo;
          </div>
        )}

        {state.kind === 'ready' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {filtered.map((course, i) => (
              <CourseCard key={course.id} card={course} index={i} />
            ))}
          </div>
        )}

        {/* ── CTA explorar ─────────────────────────────────────────────── */}
        {state.kind === 'ready' && (
          <div style={{
            marginTop: 28, padding: '18px 24px', background: 'var(--card)',
            border: '1.5px solid var(--border)', borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(24,0,173,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GraduationCap size={20} style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>¿Quieres seguir aprendiendo?</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Explora más cursos con certificación AHA 2025</div>
              </div>
            </div>
            <Link
              href="/programas"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: 'var(--brand)', color: '#fff',
                borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap',
              }}
            >
              Ver más cursos <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes courseReveal {
          from { opacity: 0; transform: translateY(20px); }
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
