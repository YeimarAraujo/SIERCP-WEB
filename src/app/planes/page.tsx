'use client';

import Footer from "@/components/page/Footer";
import Navbar from "@/components/page/Navbar";
import WhatsAppFab from "@/components/page/WhatsAppFab";
import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { plans, comparisons, faqs, testimonials } from "../../data/planes";


export default function PlanesPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ background: "var(--clr-bg)" }}>
      <Navbar forceScrolled={true} />
      <section style={{
        background: "var(--clr-bg-hero)",
        padding: "100px 0 80px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(109,74,255,0.25) 0%, transparent 50%)", pointerEvents: "none" }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center">
            <span className="badge-pill-white mb-4 d-inline-flex"><i className="bi bi-cpu-fill" style={{ fontSize: "0.8rem" }} /> Software SIERCP</span>
            <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.08, marginBottom: "20px" }}>
              Planes de <span style={{ color: "#a5f3fc" }}>Suscripción</span> Anual
            </h1>
            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 24px" }}>
              Elige el plan que mejor se adapte a tu institución. Todos incluyen actualizaciones automáticas, soporte y acceso completo desde el primer día.
            </p>

            {/* Billing badge */}
            <div className="d-inline-flex align-items-center gap-2" style={{
              background: "rgba(255,255,255,0.12)", padding: "10px 22px", borderRadius: "100px",
              border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.88rem", fontWeight: 700, color: "#fff",
            }}>
              <i className="bi bi-calendar-check-fill" style={{ color: "#a5f3fc" }} />
              Facturación anual — incluye{" "}
              <span style={{ background: "rgba(165,243,252,0.2)", color: "#a5f3fc", padding: "2px 10px", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 900 }}>
                30% OFF
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ── CARDS ── */}
      <section style={{ background: "var(--clr-bg)", padding: "80px 0 60px" }}>
        <Container>
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

          {/* Nota adicional */}
          <div className="text-center mt-5">
            <p style={{ fontSize: "0.9rem", color: "var(--clr-muted)" }}>
              <i className="bi bi-info-circle me-1" />
              ¿Tu institución tiene necesidades especiales?{" "}
              <a href="/contacto" style={{ color: "#1800ad", fontWeight: 700 }}>Solicita una cotización personalizada.</a>
              {" "}Ofrecemos descuentos para entidades educativas públicas y ONGs.
            </p>
          </div>
        </Container>
      </section>

      {/* ── TABLA COMPARATIVA ── */}
      <section className="section-py" style={{ background: "var(--clr-bg-light)" }}>
        <Container>
          <div className="text-center mb-5">
            <span className="badge-pill mb-3">Detalle completo</span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
              Comparativa de <span style={{ color: "var(--clr-primary)" }}>planes</span>
            </h2>
          </div>
          <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "#1800ad", padding: "18px 24px" }}>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Característica</div>
              {["Starter", "Profesional", "Enterprise"].map((p) => (
                <div key={p} style={{ color: "#fff", fontSize: "0.88rem", fontWeight: 900, textAlign: "center" }}>{p}</div>
              ))}
            </div>
            {comparisons.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "14px 24px", borderBottom: i < comparisons.length - 1 ? "1px solid var(--clr-border)" : "none", background: i % 2 === 0 ? "transparent" : "var(--clr-bg)" }}>
                <div style={{ fontSize: "0.9rem", color: "var(--clr-text)", fontWeight: 600 }}>{row.feature}</div>
                {[row.starter, row.pro, row.enterprise].map((val, j) => (
                  <div key={j} style={{ textAlign: "center", fontSize: "0.85rem", color: val === "—" ? "var(--clr-border)" : j === 1 ? "#1800ad" : "var(--clr-text)", fontWeight: j === 1 ? 800 : 600 }}>
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="section-py" style={{ background: "var(--clr-bg)" }}>
        <Container>
          <div className="text-center mb-5">
            <span className="badge-pill mb-3">Casos de éxito</span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
              Lo que dicen nuestros <span style={{ color: "var(--clr-primary)" }}>clientes</span>
            </h2>
          </div>
          <Row className="g-4 justify-content-center">
            {testimonials.map((t, i) => (
              <Col key={i} md={4}>
                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "32px", height: "100%" }}>
                  <div className="d-flex align-items-center gap-2 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <i key={s} className="bi bi-star-fill" style={{ color: "#f59e0b", fontSize: "0.85rem" }} />
                    ))}
                    <span style={{ fontSize: "0.7rem", background: "var(--clr-primary-alpha)", color: "#1800ad", padding: "2px 10px", borderRadius: "100px", fontWeight: 800, marginLeft: "6px" }}>
                      Plan {t.plan}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.95rem", color: "var(--clr-text)", lineHeight: 1.75, fontStyle: "italic", marginBottom: "20px" }}>
                    "{t.text}"
                  </p>
                  <div>
                    <div style={{ fontWeight: 900, color: "var(--clr-text-head)", fontSize: "0.9rem" }}>{t.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)" }}>{t.role}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── FAQ ── */}
      <section className="section-py" style={{ background: "var(--clr-bg-light)" }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="text-center mb-5">
                <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                  Preguntas sobre <span style={{ color: "var(--clr-primary)" }}>precios</span>
                </h2>
              </div>
              <div className="d-flex flex-column gap-3">
                {faqs.map((faq, i) => (
                  <div key={i} style={{ background: "var(--clr-bg-surface)", border: `1px solid ${openFaq === i ? "#1800ad" : "var(--clr-border)"}`, borderRadius: "18px", overflow: "hidden", cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <div className="d-flex justify-content-between align-items-center p-4">
                      <h6 style={{ margin: 0, fontWeight: 800, fontSize: "0.97rem", color: "var(--clr-text-head)" }}>{faq.q}</h6>
                      <i className={`bi bi-chevron-${openFaq === i ? "up" : "down"}`} style={{ color: "#1800ad", flexShrink: 0, marginLeft: "16px" }} />
                    </div>
                    {openFaq === i && (
                      <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--clr-border)", paddingTop: "16px" }}>
                        <p style={{ margin: 0, color: "var(--clr-text)", lineHeight: 1.75, fontSize: "0.92rem" }}>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background: "var(--clr-primary)", padding: "80px 0" }}>
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={7}>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fff", margin: 0 }}>
                ¿Listo para digitalizar tu formación en RCP?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", margin: "14px 0 0", lineHeight: 1.65 }}>
                Agenda una demo gratuita de 45 minutos y ve el sistema funcionando en tiempo real, sin compromiso de compra.
              </p>
            </Col>
            <Col lg={5} className="text-lg-end">
              <div className="d-flex gap-3 flex-wrap justify-content-lg-end">
                <a href="/contacto" className="btn-brand-on-dark" style={{ padding: "14px 28px", borderRadius: "14px", fontSize: "0.95rem" }}>
                  <i className="bi bi-play-circle-fill me-2" />Solicitar Demo Gratis
                </a>
                <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="btn-outline-on-dark" style={{ padding: "14px 28px", borderRadius: "14px", fontSize: "0.95rem" }}>
                  <i className="bi bi-whatsapp me-2" />Preguntar por WhatsApp
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}