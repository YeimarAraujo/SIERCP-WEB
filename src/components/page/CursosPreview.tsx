'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { cursos, type Curso } from '@/data/cursos';
import { JomarCourseService } from '@/features/super-admin/services/jomar-course.service';
import Link from 'next/link';

/* ── Hook de scroll reveal reutilizable ──────────────────────────────────── */
function useReveal(threshold = 0.1) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ── Colores de gradiente por índice de curso ────────────────────────────── */
const CARD_GRADIENTS = [
  'linear-gradient(145deg, #1800AD 0%, #6d4aff 100%)',
  'linear-gradient(145deg, #0369A1 0%, #0EA5E9 100%)',
  'linear-gradient(145deg, #065F46 0%, #10B981 100%)',
  'linear-gradient(145deg, #7C2D12 0%, #F97316 100%)',
  'linear-gradient(145deg, #4C1D95 0%, #8B5CF6 100%)',
  'linear-gradient(145deg, #0F172A 0%, #334155 100%)',
];

function CursoCard({ curso: c, index, visible }: {
  curso: Curso;
  index: number;
  visible: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div
      style={{
        minWidth: '300px',
        maxWidth: '300px',
        scrollSnapAlign: 'start',
        /* Animación de entrada escalonada */
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${0.05 + index * 0.08}s,
                     transform 0.55s cubic-bezier(0.16,1,0.3,1) ${0.05 + index * 0.08}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="curso-card h-100"
        style={{
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 32px 64px -16px rgba(24,0,173,0.18), 0 0 0 1px rgba(24,0,173,0.12)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          borderColor: hovered ? 'rgba(24,0,173,0.2)' : 'var(--clr-border)',
          transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease, border-color 0.35s ease',
        }}
      >
        {/* Cabecera con gradiente e icono */}
        <div
          className="curso-card-header"
          style={{ background: gradient }}
        >
          {/* Círculos decorativos de fondo */}
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '100px', height: '100px',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', left: '20px',
            width: '70px', height: '70px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
          }} />

          {/* Icono */}
          <i
            className={`bi ${c.icono} curso-card-icon`}
            style={{
              transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0deg)',
              transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          />

          {/* Badge de certificación */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '100px',
            padding: '3px 10px',
            fontSize: '0.6rem',
            fontWeight: 800,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <i className="bi bi-patch-check-fill" style={{ fontSize: '0.65rem' }} />
            AHA 2025
          </div>
        </div>

        {/* Cuerpo */}
        <div className="curso-card-body">
          {/* Tag de modalidad */}
          <div className="curso-card-tag">
            <i className={`bi ${c.modalidad === 'presencial' ? 'bi-geo-alt-fill' : 'bi-camera-video-fill'}`} />
            {c.modalidad === 'presencial' ? 'Presencial' : c.modalidad}
          </div>

          <h4 className="curso-card-title">{c.nombre}</h4>
          <p className="curso-card-desc">{c.descripcion}</p>

          {/* Meta: duración y formato */}
          <div className="curso-card-meta">
            <span>
              <i className="bi bi-clock" />
              {c.duracion}
            </span>
            <span>
              <i className="bi bi-people-fill" />
              Máx. 40 personas
            </span>
          </div>

          {/* CTA */}
          <Link href={`/formacion/${c.slug}`} className="curso-card-cta">
            <span>Ver detalles e inscribirse</span>
            <i
              className="bi bi-arrow-right"
              style={{
                transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.25s ease',
              }}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CursosPreview() {
  const { ref, visible } = useReveal(0.08);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [maxScroll, setMaxScroll] = useState(1);
  const [fsCursos, setFsCursos] = useState<Curso[] | null>(null);

  useEffect(() => {
    const unsub = JomarCourseService.subscribePublic(
      docs => setFsCursos(docs),
      () => setFsCursos(null),
    );
    return () => unsub();
  }, []);

  /* ── Actualiza la posición de scroll para los indicadores ─────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setScrollPos(el.scrollLeft);
      setMaxScroll(el.scrollWidth - el.clientWidth);
    };
    el.addEventListener('scroll', update, { passive: true });
    update();
    return () => el.removeEventListener('scroll', update);
  }, []);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const scrollPct = maxScroll > 0 ? Math.round((scrollPos / maxScroll) * 100) : 0;

  return (
    <section
      ref={ref}
      id="cursos"
      className="section-py"
      style={{ background: 'var(--clr-bg)', overflow: 'hidden' }}
    >
      <Container>
        {/* ── Encabezado ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '20px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div>
            {/* Badge de sección */}
            <div className="section-badge">
              <i className="bi bi-mortarboard-fill" />
              Formación Académica
            </div>
            <h2 className="section-title">
              Cursos <span className="section-title-accent">Destacados</span>
            </h2>
            <p className="section-subtitle">
              Programas avalados por la American Heart Association con los más
              altos estándares internacionales en emergencias.
            </p>
          </div>

          {/* Controles de navegación — solo desktop */}
          <div
            className="d-none d-md-flex"
            style={{ gap: '10px', alignItems: 'center', flexShrink: 0 }}
          >
            <button
              onClick={() => scrollBy(-320)}
              aria-label="Anterior"
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1.5px solid var(--clr-border)',
                background: 'var(--clr-bg-surface)',
                color: 'var(--clr-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clr-primary)'; e.currentTarget.style.color = 'var(--clr-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.color = 'var(--clr-text)'; }}
            >
              <i className="bi bi-chevron-left" />
            </button>
            <button
              onClick={() => scrollBy(320)}
              aria-label="Siguiente"
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1.5px solid var(--clr-border)',
                background: 'var(--clr-bg-surface)',
                color: 'var(--clr-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clr-primary)'; e.currentTarget.style.color = 'var(--clr-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.color = 'var(--clr-text)'; }}
            >
              <i className="bi bi-chevron-right" />
            </button>

            <Link
              href="/programas"
              className="btn-brand"
              style={{ marginLeft: '8px', borderRadius: '14px' }}
            >
              Ver todos <i className="bi bi-arrow-right ms-1" />
            </Link>
          </div>
        </div>

        {/* ── Carrusel horizontal ────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '12px',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
          className="hide-scrollbar"
        >
          {(fsCursos ?? cursos).slice(0, 8).map((c, i) => (
            <CursoCard key={c.slug} curso={c} index={i} visible={visible} />
          ))}
        </div>

        {/* ── Barra de progreso del scroll ──────────────────────────────── */}
        <div
          style={{
            height: '3px',
            background: 'var(--clr-border)',
            borderRadius: '2px',
            marginTop: '20px',
            overflow: 'hidden',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.4s',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${scrollPct}%`,
              background: 'linear-gradient(90deg, var(--clr-primary), var(--clr-accent))',
              borderRadius: '2px',
              transition: 'width 0.15s ease',
            }}
          />
        </div>

        {/* ── Banner inferior de confianza ───────────────────────────────── */}
        <div
          style={{
            marginTop: '40px',
            padding: '20px 28px',
            background: 'var(--clr-primary-alpha)',
            border: '1px solid rgba(24,0,173,0.1)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'var(--clr-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <i className="bi bi-award-fill" style={{ color: '#fff', fontSize: '1.2rem' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--clr-text-head)' }}>
                Todos los cursos incluyen certificado digital AHA
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--clr-muted)', marginTop: '2px' }}>
                Verificable en línea · Válido internacionalmente · Emitido el mismo día
              </div>
            </div>
          </div>
          <Link
            href="/programas"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px',
              background: 'var(--clr-primary)',
              color: '#fff',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.88rem',
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            Ver catálogo completo <i className="bi bi-arrow-right" />
          </Link>
        </div>

        {/* CTA móvil */}
        <div className="d-flex d-md-none justify-content-center mt-4">
          <Link href="/programas" className="btn-brand" style={{ width: '100%', justifyContent: 'center', borderRadius: '14px' }}>
            Ver todos los cursos <i className="bi bi-arrow-right ms-2" />
          </Link>
        </div>
      </Container>

      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </section>
  );
}
