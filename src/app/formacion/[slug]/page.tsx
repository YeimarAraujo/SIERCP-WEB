'use client';

import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCursoBySlug, formatCOP, formatUSD, getGruposActivos, type Curso, type Grupo } from "@/data/cursos";
import { getWhatsAppLink } from "@/data/servicios";
import { CourseService } from "@/services/firestore.service";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/page/Navbar";
import Footer from "@/components/page/Footer";
import WhatsAppFab from "@/components/page/WhatsAppFab";
import EnrollmentFlow from "@/components/page/EnrollmentFlow";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../landing.css';

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [tl, setTl] = useState({ d: 0, h: 0, m: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      setTl({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000) });
    };
    calc(); const id = setInterval(calc, 60000); return () => clearInterval(id);
  }, [targetDate]);
  return <span>{tl.d}d {tl.h}h {tl.m}m</span>;
}

function GrupoCard({ grupo, cursoSlug, onEnroll }: { grupo: Grupo; cursoSlug: string; onEnroll: (id: string) => void }) {
  const pct = (grupo.inscritos / grupo.maxEstudiantes) * 100;
  const barClass = pct > 80 ? 'high' : pct > 50 ? 'medium' : 'low';
  const fmt = (d: Date) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  const isMorning = grupo.horario === 'mañana';

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", marginBottom: "12px" }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <i className={`bi ${isMorning ? 'bi-sunrise' : 'bi-sunset'}`} style={{ color: isMorning ? '#f59e0b' : '#6366f1', fontSize: '1.1rem' }} />
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>Horario {isMorning ? 'Mañana' : 'Tarde'}</span>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>{grupo.horarioLabel}</span>
        </div>
        <span className={`enrollment-badge ${grupo.estado === 'abierto' ? 'open' : grupo.estado === 'agotado' ? 'full' : 'upcoming'}`}>
          {grupo.estado === 'abierto' ? 'Abiertas' : grupo.estado === 'agotado' ? 'Agotado' : 'Próximamente'}
        </span>
      </div>
      <div className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>
        Inscripción: <strong>{fmt(grupo.inscripcionInicio)} → {fmt(grupo.inscripcionFin)}</strong> · Clases: <strong>{fmt(grupo.inicioClases)}</strong>
      </div>
      {grupo.estado === 'abierto' && (
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>{grupo.inscritos}/{grupo.maxEstudiantes} inscritos</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: pct > 80 ? '#ef4444' : '#64748b' }}>{Math.round(pct)}%</span>
          </div>
          <div className="cupos-bar"><div className={`cupos-bar-fill ${barClass}`} style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      {grupo.estado === 'proximo' && (
        <div style={{ fontSize: "0.85rem", color: "#92400e", fontWeight: 600 }}>
          <i className="bi bi-clock me-1" /> Abre en <CountdownTimer targetDate={new Date(grupo.inscripcionInicio)} />
        </div>
      )}
      {grupo.estado === 'abierto' && grupo.inscritos < grupo.maxEstudiantes && (
        <button onClick={() => onEnroll(grupo.id)} className="btn-brand w-100 mt-2" style={{ borderRadius: "12px", padding: "10px", fontSize: "0.9rem", justifyContent: "center" }}>
          Inscribirme  <i className="bi bi-arrow-right ms-2" />
        </button>
      )}
    </div>
  );
}

export default function CursoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [activeTab, setActiveTab] = useState<'desc' | 'contenido' | 'grupos'>('desc');
  const [curso, setCurso] = useState<Curso | undefined>();
  const [realCounts, setRealCounts] = useState<Record<string, number>>({});
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | undefined>();
  const { user } = useAuth();

  useEffect(() => {
    const c = getCursoBySlug(slug);
    setCurso(c);
    if (c) {
      CourseService.getEnrollments(slug).then(enrolls => {
        const counts: Record<string, number> = {};
        enrolls.forEach(e => {
          if (e.grupoId) counts[e.grupoId] = (counts[e.grupoId] || 0) + 1;
        });
        setRealCounts(counts);
      }).catch(() => { });
    }
  }, [slug]);

  const handleEnroll = (grupoId?: string) => {
    if (!curso) return;
    const g = grupoId ? curso.grupos.find(g => g.id === grupoId) : curso.grupos.find(g => g.estado === 'abierto');
    setSelectedGrupo(g);
    setShowEnrollment(true);
  };

  if (!curso) {
    return (
      <div className="page-body">
        <Navbar forceScrolled={true} />
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="text-center">
            <i className="bi bi-exclamation-circle" style={{ fontSize: "3rem", color: "var(--clr-muted)" }} />
            <h3 className="mt-3" style={{ fontWeight: 800, color: "var(--clr-text-head)" }}>Curso no encontrado</h3>
            <Link href="/programas" className="btn-brand mt-3">Volver a programas</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const gruposActivos = getGruposActivos(curso);
  const grupoAbierto = curso.grupos.find(g => g.estado === 'abierto');
  const nivelMap = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
  const modalidadMap = { presencial: 'Presencial', virtual: 'Virtual', hibrida: 'Híbrida' };
  const tabs = [
    { key: 'desc' as const, label: 'Descripción' },
    { key: 'contenido' as const, label: 'Contenido del programa' },
    { key: 'grupos' as const, label: `Grupos (${gruposActivos.length})` },
  ];

  return (
    <div className="page-body">
      <Navbar forceScrolled={true} />
      <main style={{ paddingTop: "120px", background: "var(--clr-bg)", minHeight: "100vh" }}>
        <Container>
          <Row className="g-5">
            <Col lg={8}>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge-pill">{nivelMap[curso.nivel]}</span>
                <span className="badge-pill" style={{ background: "var(--clr-primary-alpha)", color: "var(--clr-primary)" }}>
                  <i className="bi bi-geo-alt me-1" />{modalidadMap[curso.modalidad]}
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "16px" }}>{curso.nombre}</h1>
              <p className="mb-4" style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "var(--clr-text)", opacity: 0.8 }}>{curso.descripcionLarga}</p>

              <div className="d-flex flex-wrap gap-2 mb-5">
                {[
                  { icon: "bi-clock", text: curso.duracion },
                  { icon: "bi-calendar3", text: `${curso.sesiones} sesiones` },
                  { icon: "bi-geo-alt", text: modalidadMap[curso.modalidad] },
                  ...(curso.incluyeCertificado ? [{ icon: "bi-patch-check", text: "Certificado incluido" }] : []),
                  ...curso.normativa.map(n => ({ icon: "bi-shield-check", text: n })),
                ].map((m, i) => (
                  <span key={i} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    background: "var(--clr-bg-surface)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: "100px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--clr-text)"
                  }}>
                    <i className={`bi ${m.icon}`} style={{ color: "var(--clr-primary)" }} /> {m.text}
                  </span>
                ))}
              </div>

              <div className="d-flex gap-1 mb-5" style={{ borderBottom: "2px solid var(--clr-border)" }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                    padding: "12px 24px", border: "none", background: "transparent", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                    color: activeTab === t.key ? "var(--clr-primary)" : "var(--clr-muted)",
                    borderBottom: activeTab === t.key ? "2px solid var(--clr-primary)" : "2px solid transparent", marginBottom: "-2px",
                    transition: "all 0.2s ease"
                  }}>{t.label}</button>
                ))}
              </div>

              <div className="fade-up visible">
                {activeTab === 'desc' && (
                  <div>
                    <h4 style={{ fontWeight: 800, marginBottom: "20px", fontSize: "1.4rem", color: "var(--clr-text-head)" }}>¿Qué aprenderás?</h4>
                    <div className="d-flex flex-column gap-3 mb-5">
                      {curso.objetivos.map((obj, i) => (
                        <div key={i} className="d-flex gap-3 align-items-start">
                          <i className="bi bi-check-circle-fill" style={{ color: "var(--clr-primary)", marginTop: "3px", flexShrink: 0 }} />
                          <span style={{ fontSize: "1rem", color: "var(--clr-text)" }}>{obj}</span>
                        </div>
                      ))}
                    </div>
                    <h4 style={{ fontWeight: 800, marginBottom: "20px", fontSize: "1.4rem", color: "var(--clr-text-head)" }}>Requisitos</h4>
                    <div className="d-flex flex-column gap-3 mb-5">
                      {curso.requisitos.map((r, i) => (
                        <div key={i} className="d-flex gap-3 align-items-start">
                          <i className="bi bi-arrow-right" style={{ color: "var(--clr-primary)", marginTop: "3px", flexShrink: 0 }} />
                          <span style={{ fontSize: "1rem", color: "var(--clr-text)" }}>{r}</span>
                        </div>
                      ))}
                    </div>
                    <h4 style={{ fontWeight: 800, marginBottom: "16px", fontSize: "1.4rem", color: "var(--clr-text-head)" }}>¿Para quién?</h4>
                    <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--clr-text)", opacity: 0.9 }}>{curso.paraQuien}</p>
                  </div>
                )}
                {activeTab === 'contenido' && (
                  <div className="d-flex flex-column gap-3">
                    {curso.modulos.map((mod, i) => (
                      <details key={i} className="card-brand" style={{ overflow: "hidden", cursor: "pointer" }}>
                        <summary style={{ padding: "20px", fontWeight: 700, display: "flex", justifyContent: "space-between", listStyle: "none" }}>
                          <span style={{ color: "var(--clr-text-head)" }}>
                            <span style={{ color: "var(--clr-primary)", marginRight: "12px" }}>Módulo {i + 1}</span>
                            {mod.nombre}
                          </span>
                          <span style={{ fontSize: "0.85rem", color: "var(--clr-muted)", fontWeight: 600 }}>{mod.duracion}</span>
                        </summary>
                        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--clr-border)" }}>
                          <div className="mt-3">
                            {mod.temas.map((t, j) => (
                              <div key={j} className="d-flex gap-3 align-items-center py-2">
                                <i className="bi bi-dot" style={{ color: "var(--clr-primary)", fontSize: "1.5rem" }} />
                                <span style={{ fontSize: "0.95rem", color: "var(--clr-text)" }}>{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                {activeTab === 'grupos' && (
                  <div>
                    {gruposActivos.length === 0 ? (
                      <div className="text-center py-5 card-brand">
                        <i className="bi bi-calendar-x" style={{ fontSize: "3rem", color: "var(--clr-muted)", opacity: 0.5 }} />
                        <h4 className="mt-3" style={{ color: "var(--clr-text-head)" }}>Sin grupos disponibles</h4>
                        <p className="text-muted">Las próximas inscripciones se abrirán pronto. ¡Contáctanos!</p>
                      </div>
                    ) : (
                      gruposActivos.map(g => {
                        const realGrupo = { ...g, inscritos: realCounts[g.id] || 0 };
                        return <GrupoCard key={g.id} grupo={realGrupo} cursoSlug={curso.slug} onEnroll={handleEnroll} />;
                      })
                    )}
                  </div>
                )}
              </div>
            </Col>

            <Col lg={4}>
              <div style={{ position: "sticky", top: "120px" }}>
                <div className="card-brand" style={{ padding: "32px", boxShadow: "var(--shadow-xl)" }}>
                  <div className="mb-4">
                    <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--clr-text-head)" }}>{formatCOP(curso.precioCOP)}</span>
                    <span className="text-muted ms-2" style={{ fontSize: "0.9rem", fontWeight: 700 }}>COP</span>
                    <div className="mt-1" style={{ fontSize: "1rem", color: "var(--clr-primary)", fontWeight: 700 }}>~{formatUSD(curso.precioUSD)} USD</div>
                  </div>

                  {grupoAbierto ? (
                    <button onClick={() => handleEnroll()} className="btn-brand w-100 mb-3" style={{ padding: "16px", fontSize: "1.05rem", justifyContent: "center" }}>
                      Inscribirme ahora <i className="bi bi-arrow-right ms-2" />
                    </button>
                  ) : (
                    <div className="mb-3 text-center" style={{ padding: "16px", borderRadius: "16px", background: "var(--clr-bg-light)", fontSize: "0.95rem", fontWeight: 700, color: "var(--clr-muted)", border: "1px solid var(--clr-border)" }}>
                      <i className="bi bi-clock me-2" />Inscripciones próximamente
                    </div>
                  )}

                  <a href={getWhatsAppLink(curso.nombre)} target="_blank" rel="noopener noreferrer"
                    className="btn-brand" style={{ background: "transparent", border: "1px solid var(--clr-primary)", color: "var(--clr-primary) !important", width: "100%", justifyContent: "center" }}>
                    <i className="bi bi-whatsapp me-2" /> Hablar con asesor
                  </a>

                  <div style={{ borderTop: "1px solid var(--clr-border)", marginTop: "24px", paddingTop: "24px" }}>
                    <h6 style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "16px", color: "var(--clr-text-head)" }}>Este programa incluye:</h6>
                    {[...(curso.incluyeCertificado ? ["Certificado Internacional " + curso.normativa.join("/")] : []), "Simulador SIERCP de alta fidelidad", "Material de estudio digital", "Acceso a la plataforma SIERCP", "Soporte académico"].map((b, i) => (
                      <div key={i} className="d-flex gap-3 align-items-center mb-3">
                        <i className="bi bi-check2-circle" style={{ color: "var(--clr-primary)", fontSize: "1.1rem" }} />
                        <span style={{ fontSize: "0.9rem", color: "var(--clr-text)" }}>{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3" style={{ background: "var(--clr-bg-light)", borderRadius: "16px", border: "1px solid var(--clr-border)" }}>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <i className="bi bi-shield-lock-fill text-success" />
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--clr-text-head)" }}>Pago Seguro & Protegido</span>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "var(--clr-muted)", margin: 0 }}>Procesamos pagos vía Wompi y Stripe con encriptación de nivel bancario.</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
        <div style={{ height: "100px" }} />
      </main>
      <Footer />
      <WhatsAppFab />
      {curso && (
        <EnrollmentFlow
          show={showEnrollment}
          onHide={() => setShowEnrollment(false)}
          curso={curso}
          grupo={selectedGrupo}
        />
      )}
    </div>
  );
}
