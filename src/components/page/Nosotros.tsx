'use client';

import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";

const numbers = [
  { big: "500", suffix: "+", label: "Personas certificadas" },
  { big: "9", suffix: "", label: "Programas activos" },
  { big: "8", suffix: "+", label: "Años de experiencia" },
  { big: "30", suffix: "+", label: "Empresas aliadas" },
];

const feats = [
  {
    icon: "bi-check2-circle", title: "Instructores certificados internacionalmente",
    desc: "Avalados por la AHA, Cruz Roja y organismos de salvamento acuático."
  },
  {
    icon: "bi-check2-circle", title: "Metodología basada en evidencia",
    desc: "Protocolos actualizados y validados científicamente para cada programa."
  },
  {
    icon: "bi-check2-circle", title: "Formación práctica y tecnológica",
    desc: "Simulacros reales, maniquíes de alta fidelidad y plataformas digitales (SIERCP-IoT v.1)."
  },
];

export default function Nosotros() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="nosotros" ref={ref} className="section-py" style={{ background: "var(--clr-bg)", position: "relative", overflow: "hidden" }}>
      {/* Decorative Gradient Glows */}
      <div style={{
        position: "absolute", top: "-10%", left: "-10%", width: "40%", height: "60%",
        background: "var(--clr-accent-glow)", filter: "blur(120px)", borderRadius: "50%",
        opacity: 0.4, pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-10%", width: "30%", height: "50%",
        background: "var(--clr-primary-alpha)", filter: "blur(100px)", borderRadius: "50%",
        opacity: 0.3, pointerEvents: "none", zIndex: 0
      }} />

      <Container style={{ position: "relative", zIndex: 1 }}>
        <Row className="align-items-center g-5">
          <Col lg={6} className={`fade-in-left ${isVisible ? "visible" : ""}`}>
            <span className="badge-pill mb-3">Nuestra Trayectoria</span>
            <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, marginBottom: 24, lineHeight: 1.1, color: "var(--clr-text-head)" }}>
              Compromiso con la <span style={{ color: 'var(--clr-primary)' }}>Excelencia</span> Humana
            </h2>
            <p className="mb-5" style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "var(--clr-text)", opacity: 0.9 }}>
              Desde 2004, Jomar Segurid ha sido el pilar de la formación en emergencias en la región.
              Nuestra evolución nos ha llevado de una academia tradicional a un centro de innovación
              tecnológica aplicada a la salud.
            </p>

            <div className="d-flex flex-column gap-4">
              {feats.map((f, i) => (
                <div key={i} className="d-flex align-items-start gap-4">
                  <div className="icon-box icon-box-md" style={{
                    background: "var(--clr-primary-alpha)",
                    borderRadius: "16px",
                    color: "var(--clr-primary)",
                    border: "1px solid var(--clr-border)"
                  }}>
                    <i className={`bi ${f.icon}`} />
                  </div>
                  <div>
                    <h6 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 4, color: "var(--clr-text-head)" }}>{f.title}</h6>
                    <p style={{ fontSize: "0.95rem", margin: 0, color: "var(--clr-text)", opacity: 0.7 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Col>

          <Col lg={6}>
            <div className={`fade-in-right ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.4s" }}>
              <div style={{
                background: "var(--clr-bg-surface)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--clr-border)",
                borderRadius: "32px",
                padding: "40px",
                boxShadow: "var(--shadow-xl)"
              }}>
                <div className="text-center mb-5">
                  <h4 style={{ fontWeight: 900, fontSize: "1.8rem", color: "var(--clr-text-head)" }}>Impacto Regional</h4>
                  <div style={{ width: "40px", height: "4px", background: "var(--clr-primary)", margin: "16px auto", borderRadius: "2px" }} />
                </div>

                <Row className="g-4">
                  {numbers.map((n, i) => (
                    <Col xs={6} key={i}>
                      <div className="text-center p-4" style={{
                        background: "var(--clr-bg-light)",
                        borderRadius: "24px",
                        border: "1px solid var(--clr-border)",
                        transition: "var(--transition)"
                      }}>
                        <div style={{
                          fontSize: "2.8rem",
                          fontWeight: 900,
                          color: "var(--clr-primary)",
                          fontFamily: "var(--font-head)",
                          lineHeight: 1
                        }}>
                          {isVisible ? n.big : "0"}{n.suffix}
                        </div>
                        <p className="mt-3 mb-0" style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                          fontWeight: 800,
                          color: "var(--clr-muted)"
                        }}>
                          {n.label}
                        </p>
                      </div>
                    </Col>
                  ))}
                </Row>

                <div className="mt-5 p-4 text-center" style={{
                  background: "var(--clr-primary-alpha)",
                  borderRadius: "20px",
                  border: "1px dashed var(--clr-primary)"
                }}>
                  <p style={{ fontSize: "1rem", fontStyle: "italic", margin: 0, color: "var(--clr-text)", fontWeight: 500 }}>
                    "20 años transformando el miedo en conocimiento."
                  </p>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
