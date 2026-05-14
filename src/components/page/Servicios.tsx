'use client';

import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { servicios, getWhatsAppLink } from "@/data/servicios";

const statsBar = [
  { value: "+50", label: "Empresas asesoradas", icon: "bi-building-fill" },
  { value: "100%", label: "Aval AHA vigente", icon: "bi-patch-check-fill" },
  { value: "Res. 3100", label: "Normativa cumplida", icon: "bi-shield-fill-check" },
  { value: "B2B", label: "Soluciones a medida", icon: "bi-briefcase-fill" },
];

export default function Servicios() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="servicios"
      ref={ref}
      className="section-py"
      style={{ background: "var(--clr-bg-light)", position: "relative", overflow: "hidden" }}
    >

      <Container>

        {/* ── Header ── */}
        <Row className="mb-5 align-items-end g-4">
          <Col lg={6} className={`fade-up ${isVisible ? "visible" : ""}`}>
            <span className="badge-pill mb-3">Servicios Corporativos</span>
            <h2 style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 900,
              color: "var(--clr-text-head)",
              lineHeight: 1.1,
            }}>
              Protege tu Empresa{" "}
              <span style={{ color: "var(--clr-primary)" }}>con Estándares Clínicos</span>
            </h2>
            <p className="mt-3" style={{
              fontSize: "1.05rem", lineHeight: 1.75,
              color: "var(--clr-muted)", maxWidth: "520px",
            }}>
              Asesoría, auditoría y diseño de planes de emergencia alineados con la{" "}
              <strong style={{ color: "var(--clr-text-head)", fontWeight: 800 }}>Resolución 3100 de 2019</strong>{" "}
              y los estándares internacionales AHA y ERC.
            </p>
          </Col>

          {/* Stats mini grid */}
          <Col lg={6} className={`fade-up ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.12s" }}>
            <div style={{
              background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)",
              borderRadius: "20px", padding: "20px 24px",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
            }}>
              {statsBar.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                    background: "var(--clr-primary-alpha)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className={`bi ${s.icon}`} style={{ color: "var(--clr-primary)", fontSize: "1rem" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--clr-primary)", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--clr-muted)", fontWeight: 600, marginTop: "2px", lineHeight: 1.2 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>

        {/* ── Separator ── */}
        <div
          className={`fade-up ${isVisible ? "visible" : ""}`}
          style={{
            transitionDelay: "0.18s",
            display: "flex", alignItems: "center", gap: "12px",
            marginBottom: "28px", paddingBottom: "20px",
            borderBottom: "1px solid var(--clr-border)",
          }}
        >
          <i className="bi bi-briefcase-fill" style={{ color: "var(--clr-primary)", fontSize: "1rem" }} />
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--clr-text-head)" }}>
            Portafolio de servicios corporativos
          </span>
          <span style={{
            marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(37,99,235,0.08)", color: "var(--clr-primary)",
            fontSize: "0.7rem", fontWeight: 800,
            padding: "4px 12px", borderRadius: "8px",
          }}>
            <i className="bi bi-whatsapp" style={{ fontSize: "0.75rem" }} />
            Cotización inmediata
          </span>
        </div>

        {/* ── Cards ── */}
        <Row className="g-4">
          {servicios.map((s, i) => (
            <Col key={s.slug} md={6} lg={4}>
              <div
                className={`fade-up ${isVisible ? "visible" : ""}`}
                style={{
                  transitionDelay: `${0.1 + i * 0.08}s`,
                  background: "var(--clr-bg-surface)",
                  border: `1px solid ${activeCard === i ? "var(--clr-primary)" : "var(--clr-border)"}`,
                  borderRadius: "20px",
                  display: "flex", flexDirection: "column",
                  transition: "all 0.3s ease",
                  boxShadow: activeCard === i ? "0 12px 40px rgba(0,0,0,0.09)" : "var(--shadow-sm)",
                  overflow: "hidden", height: "100%", cursor: "pointer",
                }}
                onMouseEnter={() => setActiveCard(i)}
                onMouseLeave={() => setActiveCard(null)}
              >

                <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>

                  {/* Icon */}
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "14px",
                    background: "var(--clr-primary-alpha)", color: "var(--clr-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.5rem", marginBottom: "16px",
                    transition: "transform 0.3s ease",
                    transform: activeCard === i ? "scale(1.08) rotate(-3deg)" : "scale(1)",
                  }}>
                    <i className={`bi ${s.icono}`} />
                  </div>

                  {/* Industrias chips */}
                  {s.industrias?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                      {s.industrias.slice(0, 3).map((ind, idx) => (
                        <span key={idx} style={{
                          fontSize: "0.58rem", fontWeight: 700,
                          padding: "3px 8px", borderRadius: "6px",
                          background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                          color: "var(--clr-muted)",
                          display: "inline-flex", alignItems: "center", gap: "3px",
                        }}>
                          <i className={`bi ${ind.icono}`} style={{ fontSize: "0.6rem" }} />
                          {ind.nombre}
                        </span>
                      ))}
                    </div>
                  )}

                  <h4 style={{
                    fontSize: "1.1rem", fontWeight: 800,
                    color: "var(--clr-text-head)", marginBottom: "10px", lineHeight: 1.25,
                  }}>
                    {s.nombre}
                  </h4>

                  <p style={{
                    fontSize: "0.88rem", color: "var(--clr-muted)",
                    lineHeight: 1.7, marginBottom: "20px", flex: 1,
                  }}>
                    {s.descripcion}
                  </p>

                  {/* Entregables */}
                  <div style={{
                    background: "var(--clr-bg)", padding: "14px 16px",
                    borderRadius: "12px", border: "1px solid var(--clr-border)", marginBottom: "16px",
                  }}>
                    <div style={{
                      fontSize: "0.62rem", fontWeight: 800, color: "var(--clr-muted)",
                      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px",
                    }}>
                      Entregables
                    </div>
                    {s.entregables.slice(0, 3).map((e, idx) => (
                      <div key={idx} className="d-flex align-items-start gap-2 mb-2">
                        <i className="bi bi-check2-circle" style={{
                          color: "var(--clr-primary)", fontSize: "0.85rem",
                          marginTop: "2px", flexShrink: 0,
                        }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--clr-text)", lineHeight: 1.4 }}>{e}</span>
                      </div>
                    ))}
                    {s.entregables.length > 3 && (
                      <div style={{
                        fontSize: "0.72rem", color: "var(--clr-primary)",
                        fontWeight: 700, marginTop: "6px",
                        display: "flex", alignItems: "center", gap: "4px",
                      }}>
                        <i className="bi bi-plus-circle" style={{ fontSize: "0.75rem" }} />
                        {s.entregables.length - 3} entregables más
                      </div>
                    )}
                  </div>

                  {/* Precio desde */}
                  {s.precioDesdeCOP > 0 && (
                    <div style={{
                      display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "16px",
                    }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--clr-muted)", fontWeight: 600 }}>Desde</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--clr-text-head)" }}>
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency", currency: "COP", maximumFractionDigits: 0,
                        }).format(s.precioDesdeCOP)}
                      </span>
                    </div>
                  )}

                  {/* CTA */}
                  <a
                    href={getWhatsAppLink(s.nombre)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: "none", borderRadius: "12px", padding: "12px",
                      fontWeight: 800, fontSize: "0.88rem",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      background: "var(--clr-primary)", color: "#fff",
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    <i className="bi bi-whatsapp" />
                    Cotizar servicio
                  </a>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* ── Bottom trust bar ── */}
        <div
          className={`fade-up ${isVisible ? "visible" : ""}`}
          style={{
            transitionDelay: "0.5s", marginTop: "48px",
            padding: "20px 28px",
            background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)",
            borderRadius: "16px",
            display: "flex", flexWrap: "wrap",
            alignItems: "center", justifyContent: "space-between", gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <i className="bi bi-shield-fill-check" style={{ color: "var(--clr-primary)", fontSize: "1.3rem" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--clr-text-head)" }}>
                Cumplimiento legal garantizado en cada proyecto
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--clr-muted)", marginTop: "2px" }}>
                Resolución 3100 de 2019 · Guías AHA 2020–2025 · ISO 9001 compatible
              </div>
            </div>
          </div>
          <a
            href="#contacto"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              color: "var(--clr-primary)", fontWeight: 800, fontSize: "0.88rem",
              textDecoration: "none", padding: "10px 20px",
              border: "1.5px solid var(--clr-primary)", borderRadius: "12px",
              transition: "all 0.2s ease", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--clr-primary)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--clr-primary)"; }}
          >
            Hablar con un asesor
            <i className="bi bi-arrow-right" />
          </a>
        </div>

      </Container>
    </section>
  );
}