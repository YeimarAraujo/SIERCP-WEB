'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { cursos } from '@/data/cursos';
import Link from 'next/link';

export default function CursosPreview() {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
  };

  return (
    <section ref={ref} className="section-py" style={{ background: "var(--clr-bg)", overflow: "hidden" }}>
      <Container>
        <div className={`d-flex justify-content-between align-items-end mb-5 fade-up ${vis ? "visible" : ""}`}>
          <div>
            <span className="badge-pill mb-3">Formación Académica</span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)", margin: 0 }}>
              Cursos <span style={{ color: "var(--clr-primary)" }}>Destacados</span>
            </h2>
          </div>
          <div className="d-none d-md-flex gap-3 align-items-center">
            <button onClick={scrollLeft} style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-surface)', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--clr-border)'}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <button onClick={scrollRight} style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-surface)', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--clr-border)'}>
              <i className="bi bi-chevron-right"></i>
            </button>
            <Link href="/cursos" className="btn-brand" style={{ marginLeft: '10px' }}>
              Ver Todos <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>

        <div className={`fade-up ${vis ? "visible" : ""}`} style={{ transitionDelay: "0.2s" }}>
          <div ref={scrollRef} style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '20px', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="hide-scrollbar">
            {cursos.slice(0, 8).map((c, i) => (
              <div key={c.slug} style={{ minWidth: '320px', maxWidth: '320px', scrollSnapAlign: 'start' }}>
                <div className="card-brand h-100" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--clr-primary-alpha)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 20 }}>
                    <i className={`bi ${c.icono}`}></i>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--clr-text-head)', marginBottom: 12 }}>{c.nombre}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--clr-text)', opacity: 0.8, marginBottom: 20, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.descripcion}
                  </p>
                  <div className="d-flex align-items-center gap-2 mb-4" style={{ fontSize: '0.85rem', color: 'var(--clr-muted)', fontWeight: 600 }}>
                    <i className="bi bi-clock"></i> {c.duracion} • {c.modalidad}
                  </div>
                  <Link href={`/formacion/${c.slug}`} className="btn-brand" style={{ width: '100%', justifyContent: 'center', padding: '10px', background: 'transparent', color: 'var(--clr-text-head) !important', border: '1px solid var(--clr-border)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--clr-primary)'; e.currentTarget.style.color = 'var(--clr-text-head)'; e.currentTarget.style.borderColor = 'var(--clr-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--clr-text-head) !important'; e.currentTarget.style.borderColor = 'var(--clr-border)'; }}>
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="d-flex d-md-none justify-content-center mt-4 gap-3">
          <Link href="/cursos" className="btn-brand" style={{ width: '100%', justifyContent: 'center' }}>
            Ver Todos los Cursos
          </Link>
        </div>
      </Container>
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </section>
  );
}
