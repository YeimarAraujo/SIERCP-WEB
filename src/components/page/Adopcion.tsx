'use client';

import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";

const benefits = [
  {
    icon: "bi-rocket-takeoff-fill",
    title: "Acceso Prioritario",
    desc: "Sé el primero en recibir las nuevas versiones de hardware y actualizaciones de firmware."
  },
  {
    icon: "bi-shield-fill-check",
    title: "Soporte VIP",
    desc: "Canal directo con nuestro equipo de ingeniería para personalización y asistencia técnica."
  },
  {
    icon: "bi-graph-up-arrow",
    title: "Métricas Exclusivas",
    desc: "Acceso a tableros de analítica avanzada que aún no están disponibles para el público general."
  }
];

export default function Adopcion() {
  const [submitted, setSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="registro" ref={ref} className="section-py" style={{ background: "var(--clr-bg-light)", position: "relative" }}>
      <Container style={{ position: "relative", zIndex: 1 }}>
        <Row className="g-5 align-items-center">
          {/* Left: Narrative Symmetry */}
          <Col lg={5} className={`fade-in-left d-flex flex-column justify-content-center ${isVisible ? "visible" : ""}`}>
            <span className="badge-pill mb-3">Adopción Tecnológica</span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)", lineHeight: 1.15 }}>
              Lleva la tecnología <span style={{ color: 'var(--clr-primary)' }}>SIERCP</span> a tu institución
            </h2>
            <p className="mt-4 mb-5" style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--clr-text)", opacity: 0.8 }}>
              Estamos expandiendo nuestra red de aliados estratégicos. Únete al programa 2025 y transforma la capacitación clínica.
            </p>

            <div className="d-flex flex-column gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="d-flex gap-4">
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    background: "var(--clr-primary-alpha)", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "var(--clr-primary)",
                    flexShrink: 0,
                    border: "1px solid var(--clr-border)"
                  }}>
                    <i className={`bi ${b.icon}`} style={{ fontSize: "1.2rem" }} />
                  </div>
                  <div>
                    <h6 style={{ fontWeight: 800, marginBottom: 4, color: "var(--clr-text-head)", fontSize: "1.05rem" }}>{b.title}</h6>
                    <p style={{ fontSize: "0.9rem", color: "var(--clr-text)", opacity: 0.7, margin: 0, lineHeight: 1.5 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Col>

          {/* Right: Technical Form Control */}
          <Col lg={7}>
            <div className={`fade-in-right ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.2s" }}>
              <div style={{
                background: "var(--clr-bg-surface)",
                padding: "48px",
                borderRadius: "32px",
                border: "1px solid var(--clr-border)",
                boxShadow: "var(--shadow-xl)",
                position: "relative",
                overflow: "hidden"
              }}>
                {!submitted ? (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <h4 style={{ fontWeight: 800, fontSize: "1.6rem", color: "var(--clr-text-head)", marginBottom: "8px" }}>Formulario de Aplicación</h4>
                      <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem" }}>Cuéntanos sobre tu institución para iniciar el proceso.</p>
                      <div style={{ width: "40px", height: "4px", background: "var(--clr-primary)", marginTop: 16, borderRadius: "2px" }} />
                    </div>
                    <Row className="g-4">
                      <Col md={12}>
                        <div className="form-group">
                          <label className="label-brand">Institución</label>
                          <input type="text" className="input-brand" placeholder="Nombre de la entidad" required />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="form-group">
                          <label className="label-brand">Contacto</label>
                          <input type="text" className="input-brand" placeholder="Nombre completo" required />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="form-group">
                          <label className="label-brand">Email</label>
                          <input type="email" className="input-brand" placeholder="ejemplo@correo.com" required />
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="form-group">
                          <label className="label-brand">Alcance del Proyecto</label>
                          <select className="input-brand" style={{ appearance: "auto" }}>
                            <option>Integración completa (Hardware + Software)</option>
                            <option>Actualización de maniquíes</option>
                            <option>Consultoría en Simulación</option>
                          </select>
                        </div>
                      </Col>
                      <Col md={12} className="mt-5">
                        <button type="submit" className="btn-brand w-100" style={{ padding: "16px", fontSize: "1rem" }}>
                          Enviar Aplicación <i className="bi bi-send-fill ms-2" />
                        </button>
                      </Col>
                    </Row>
                  </form>
                ) : (
                  <div className="text-center py-5">
                    <div style={{
                      width: "80px", height: "80px", background: "var(--clr-success)",
                      color: "#fff", borderRadius: "50%", display: "flex",
                      alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
                      fontSize: "2rem", boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)"
                    }}>
                      <i className="bi bi-check2" />
                    </div>
                    <h5 style={{ fontWeight: 800, marginBottom: 12, fontSize: "1.5rem", color: "var(--clr-text-head)" }}>Solicitud Recibida</h5>
                    <p style={{ color: "var(--clr-text)", opacity: 0.7, fontSize: "1rem", maxWidth: "340px", margin: "0 auto", lineHeight: 1.6 }}>
                      Excelente. Nuestro equipo de ingeniería revisará tu perfil y te contactará en las próximas 24 horas.
                    </p>
                    <button onClick={() => setSubmitted(false)} className="mt-5" style={{ background: "none", border: "none", color: "var(--clr-primary)", fontWeight: 700, textDecoration: "underline", fontSize: "0.9rem" }}>
                      Enviar otra solicitud
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
