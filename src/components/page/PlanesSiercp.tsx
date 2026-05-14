'use client';

import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { plans } from "../../data/planes"

export default function PlanesSiercp() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="planes" ref={ref} className="section-py" style={{ background: "var(--clr-bg-light)" }}>
      <Container>
        <div className={`text-center mb-5 fade-up ${isVisible ? "visible" : ""}`}>
          <span className="badge-pill mb-3">Software SIERCP</span>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
            Planes de <span style={{ color: "var(--clr-primary)" }}>Suscripción</span>
          </h2>
          <p className="mx-auto mt-3" style={{ maxWidth: "550px", fontSize: "1.05rem", lineHeight: 1.7 }}>
            Elige el plan que mejor se adapte a tu institución. Todos incluyen actualizaciones automáticas.
          </p>

          {/* Anual badge */}
          <div className="d-inline-flex align-items-center gap-2 mt-4" style={{
            background: "var(--clr-bg-surface)", padding: "8px 20px", borderRadius: "100px",
            border: "1px solid var(--clr-border)", fontSize: "0.85rem", fontWeight: 700, color: "var(--clr-text-head)"
          }}>
            <i className="bi bi-calendar-check-fill" style={{ color: "var(--clr-primary)" }} />
            Facturación anual
            <span style={{
              fontSize: "0.7rem", background: "var(--clr-primary-alpha)", padding: "2px 8px",
              borderRadius: "100px", color: "var(--clr-primary)", fontWeight: 800
            }}>30% OFF</span>
          </div>
        </div>

        <Row className="g-4 justify-content-center">
          {plans.map((plan, i) => {
            const monthlyPrice = Math.round(plan.monthlyCOP * 0.7);
            const annualTotal = monthlyPrice * 12;
            return (
              <Col key={plan.name} md={6} lg={4}>
                <div className={`fade-up ${isVisible ? "visible" : ""} h-100`} style={{
                  transitionDelay: `${i * 0.1}s`,
                  background: plan.highlight ? "#1800ad" : "var(--clr-bg-surface)",
                  color: plan.highlight ? "#fff" : "var(--clr-text)",
                  border: plan.highlight ? "2px solid #1800ad" : "1px solid var(--clr-border)",
                  borderRadius: "28px", padding: "36px 30px", position: "relative", overflow: "hidden",
                  transform: plan.highlight ? "scale(1.03)" : "scale(1)",
                  boxShadow: plan.highlight ? "0 30px 70px rgba(24,0,173,0.22)" : "var(--shadow-sm)",
                  transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                }}>
                  {plan.badge && (
                    <div style={{
                      position: "absolute", top: "18px", right: "18px",
                      background: plan.highlight ? "rgba(255,255,255,0.2)" : "var(--clr-primary-alpha)",
                      color: plan.highlight ? "#fff" : "#1800ad",
                      padding: "4px 12px", borderRadius: "100px",
                      fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px",
                    }}>
                      {plan.badge}
                    </div>
                  )}

                  <h4 style={{ fontWeight: 900, fontSize: "1.4rem", marginBottom: "4px" }}>{plan.name}</h4>
                  <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "24px", lineHeight: 1.5 }}>{plan.desc}</p>

                  <div style={{ marginBottom: "4px" }}>
                    <span style={{ fontSize: "2.6rem", fontWeight: 900, lineHeight: 1 }}>
                      ${monthlyPrice.toLocaleString("es-CO")}
                    </span>
                    <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>/mes COP</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.45, textDecoration: "line-through", marginBottom: "6px" }}>
                    ${plan.monthlyCOP.toLocaleString("es-CO")}/mes sin descuento
                  </div>
                  <div style={{
                    fontSize: "0.78rem", fontWeight: 800,
                    background: plan.highlight ? "rgba(255,255,255,0.15)" : "var(--clr-primary-alpha)",
                    color: plan.highlight ? "#a5f3fc" : "#1800ad",
                    padding: "5px 12px", borderRadius: "8px", display: "inline-block", marginBottom: "24px",
                  }}>
                    <i className="bi bi-tag-fill me-1" />
                    Total anual: ${annualTotal.toLocaleString("es-CO")} COP
                  </div>

                  <button style={{
                    width: "100%", padding: "13px", borderRadius: "14px", fontWeight: 800, fontSize: "0.95rem",
                    cursor: "pointer", marginBottom: "28px", border: "none",
                    background: plan.highlight ? "#fff" : "#1800ad",
                    color: plan.highlight ? "#1800ad" : "#fff",
                    transition: "all 0.2s ease",
                  }}>
                    {plan.name === "Enterprise" ? "Contactar ventas" : "Comenzar ahora"}
                  </button>

                  <div>
                    {plan.features.map((f, j) => (
                      <div key={j} className="d-flex gap-2 align-items-center mb-2">
                        <i
                          className={f.included ? "bi bi-check-circle-fill" : "bi bi-x-circle"}
                          style={{
                            fontSize: "0.9rem", flexShrink: 0,
                            color: f.included
                              ? (plan.highlight ? "#a5f3fc" : "#10b981")
                              : (plan.highlight ? "rgba(255,255,255,0.2)" : "var(--clr-border)"),
                          }}
                        />
                        <span style={{ fontSize: "0.85rem", opacity: f.included ? 0.9 : 0.4 }}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>

        <div className={`text-center mt-5 fade-up ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.4s" }}>
          <a
            href="/planes"
            className="btn-brand"
            style={{
              background: "transparent", border: "1px solid var(--clr-border)",
              color: "var(--clr-text-head) !important", padding: "12px 32px", borderRadius: "100px"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--clr-bg-surface)"; e.currentTarget.style.borderColor = "var(--clr-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--clr-border)"; }}
          >
            Ver todos los planes <i className="bi bi-arrow-right ms-2"></i>
          </a>
        </div>
      </Container>
    </section>
  );
}