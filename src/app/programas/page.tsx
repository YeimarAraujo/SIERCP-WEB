'use client';

import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Navbar from '@/components/page/Navbar';
import Footer from '@/components/page/Footer';
import WhatsAppFab from '@/components/page/WhatsAppFab';
import { useCatalog } from '@/hooks/useCatalog';
import { cursos as staticCursos } from '@/data/cursos';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../landing.css';

import { servicios } from '@/data/servicios';

export default function ProgramasPage() {
  const { cursos: dynamicCursos, loading } = useCatalog();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModalidad, setFilterModalidad] = useState('todas');
  const [filterNivel, setFilterNivel] = useState('todos');

  // Use dynamic catalog when available, fall back to static data
  const cursos = dynamicCursos.length > 0 ? dynamicCursos : staticCursos;

  const filteredCursos = cursos.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchModalidad = filterModalidad === 'todas' || c.modalidad === filterModalidad;
    const matchNivel = filterNivel === 'todos' || c.nivel === filterNivel;
    return matchSearch && matchModalidad && matchNivel;
  });

  return (
    <div className="page-body">
      <Navbar forceScrolled={true} />
      <main style={{ paddingTop: '120px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--clr-bg)' }}>
        <Container>
          <div className="text-center mb-5">
            <span className="badge-pill mb-3">Catálogo Académico</span>
            <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
              Nuestros <span style={{ color: "var(--clr-primary)" }}>Programas</span>
            </h1>
            <p className="mx-auto mt-3" style={{ maxWidth: "600px", fontSize: "1.15rem", lineHeight: 1.7, color: "var(--clr-text)", opacity: 0.8 }}>
              Capacitación de alto nivel con tecnología SIERCP-IoT integrada para un aprendizaje basado en datos y simulación real.
            </p>
          </div>

          {/* Filters */}
          <div className="card-brand mb-5" style={{ padding: '28px', border: '1px solid var(--clr-border)', boxShadow: 'var(--shadow-lg)' }}>
            <Row className="g-4">
              <Col md={6} lg={4}>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 18, top: 14, color: 'var(--clr-primary)' }}></i>
                  <input 
                    type="text" 
                    className="input-brand" 
                    placeholder="Buscar curso o tema..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
              </Col>
              <Col md={3} lg={4}>
                <select 
                  className="input-brand" 
                  value={filterModalidad} 
                  onChange={(e) => setFilterModalidad(e.target.value)}
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  <option value="todas">Todas las modalidades</option>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                  <option value="hibrida">Híbrida</option>
                </select>
              </Col>
              <Col md={3} lg={4}>
                <select 
                  className="input-brand" 
                  value={filterNivel} 
                  onChange={(e) => setFilterNivel(e.target.value)}
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  <option value="todos">Todos los niveles</option>
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </Col>
            </Row>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center mb-4">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 20px', borderRadius: 20, background: 'var(--clr-primary-alpha)',
                fontSize: '0.85rem', fontWeight: 600, color: 'var(--clr-primary)',
              }}>
                <div style={{
                  width: 14, height: 14, border: '2px solid var(--clr-primary)',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Actualizando catálogo...
              </div>
            </div>
          )}

          <Row className="g-4 mb-5">
            {filteredCursos.length > 0 ? filteredCursos.map((c) => (
              <Col key={c.slug} md={6} lg={4}>
                <div className="card-brand h-100" style={{ padding: '32px', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease' }}
                     onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--clr-primary-alpha)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: 24, border: '1px solid var(--clr-border)' }}>
                    <i className={`bi ${c.icono}`}></i>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span className="badge-pill" style={{ padding: '4px 12px', fontSize: '0.65rem' }}>{c.nivel}</span>
                    <span className="badge-pill" style={{ padding: '4px 12px', fontSize: '0.65rem', background: 'var(--clr-bg-light)', border: '1px solid var(--clr-border)', color: 'var(--clr-text)' }}>{c.modalidad}</span>
                    {/* Show group availability from live data */}
                    {c.grupos && c.grupos.some(g => g.estado === 'abierto') && (
                      <span style={{
                        padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800,
                        borderRadius: 20, background: '#DCFCE7', color: '#166534',
                      }}>● Inscripciones abiertas</span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-text-head)', marginBottom: 12 }}>{c.nombre}</h4>
                  <p style={{ fontSize: '0.95rem', color: 'var(--clr-text)', opacity: 0.8, marginBottom: 24, flex: 1, lineHeight: 1.6 }}>
                    {c.descripcion}
                  </p>
                  
                  <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '24px', marginBottom: '28px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span style={{ fontSize: '0.85rem', color: 'var(--clr-muted)', fontWeight: 600 }}><i className="bi bi-clock me-2"></i>Duración</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--clr-text-head)' }}>{c.duracion}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ fontSize: '0.85rem', color: 'var(--clr-muted)', fontWeight: 600 }}><i className="bi bi-tag me-2"></i>Inversión</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--clr-primary)' }}>${new Intl.NumberFormat('es-CO').format(c.precioCOP)} <span style={{ fontSize: '0.7rem', color: 'var(--clr-muted)' }}>COP</span></span>
                    </div>
                  </div>

                  <Link href={`/formacion/${c.slug}`} className="btn-brand" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                    Ver Temario Completo <i className="bi bi-arrow-right ms-2" />
                  </Link>
                </div>
              </Col>
            )) : (
              <Col xs={12}>
                <div className="text-center p-5 card-brand">
                  <i className="bi bi-search mb-4" style={{ fontSize: '4rem', color: 'var(--clr-muted)', opacity: 0.3 }}></i>
                  <h3 style={{ color: 'var(--clr-text-head)', fontWeight: 800 }}>Sin resultados</h3>
                  <p className="text-muted" style={{ fontSize: '1.1rem' }}>No encontramos programas que coincidan con tu búsqueda.</p>
                  <button onClick={() => { setSearchTerm(''); setFilterModalidad('todas'); setFilterNivel('todos'); }} className="btn-brand mt-4" style={{ background: 'transparent', border: '1px solid var(--clr-primary)', color: 'var(--clr-primary) !important' }}>
                    Restablecer Filtros
                  </button>
                </div>
              </Col>
            )}
          </Row>

          {/* Corporate Services Section */}
          <div className="mt-5 pt-5">
             <div className="text-center mb-5">
                <span className="badge-pill mb-3">Soluciones Empresariales</span>
                <h2 style={{ fontWeight: 900, color: 'var(--clr-text-head)' }}>Servicios <span style={{ color: 'var(--clr-primary)' }}>Corporativos</span></h2>
                <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>Programas diseñados para brigadas de emergencia, sector salud y organizaciones que priorizan la vida.</p>
             </div>
             <Row className="g-4">
                {servicios.map(s => (
                  <Col key={s.slug} md={6}>
                    <div className="card-brand d-flex gap-4 p-4 align-items-center h-100">
                      <div style={{ width: 80, height: 80, borderRadius: '20px', background: 'var(--clr-primary-alpha)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0 }}>
                        <i className={`bi ${s.icono}`}></i>
                      </div>
                      <div>
                        <h5 style={{ fontWeight: 800, color: 'var(--clr-text-head)', marginBottom: 8 }}>{s.nombre}</h5>
                        <p style={{ fontSize: '0.9rem', color: 'var(--clr-text)', opacity: 0.7, margin: 0 }}>Soluciones a medida para su institución con certificación y seguimiento en tiempo real.</p>
                        <Link href="/contacto" className="mt-3 d-inline-flex align-items-center gap-2" style={{ color: 'var(--clr-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                          Solicitar Cotización <i className="bi bi-arrow-right" />
                        </Link>
                      </div>
                    </div>
                  </Col>
                ))}
             </Row>
          </div>
        </Container>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
