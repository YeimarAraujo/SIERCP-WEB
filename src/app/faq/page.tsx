'use client';

import Footer from "@/components/page/Footer";
import Navbar from "@/components/page/Navbar";
import WhatsAppFab from "@/components/page/WhatsAppFab";
import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { faqs, categories, helpTopics } from "@/data/faqs";

export default function FAQPage() {
  const [activeCat, setActiveCat] = useState("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const filtered = faqs.filter((f) => {
    const matchCat = activeCat === "all" || f.cat === activeCat;
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div ref={ref} style={{ background: "var(--clr-bg)" }}>
      <Navbar forceScrolled={true} />
      {/* ── HERO ── */}
      <section style={{
        background: "var(--clr-bg-hero)",
        padding: "120px 0 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center">
            <span className="badge-pill-white mb-4 d-inline-flex"><i className="bi bi-question-circle-fill" style={{ fontSize: "0.8rem" }} /> Centro de Ayuda</span>
            <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.08, marginBottom: "20px" }}>
              Preguntas <span style={{ color: "#a5f3fc" }}>Frecuentes</span>
            </h1>
            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 36px" }}>
              Encuentra respuesta a las dudas más comunes sobre nuestra plataforma, cursos y certificaciones.
            </p>

            {/* Search */}
            <div style={{ maxWidth: "560px", margin: "0 auto", position: "relative" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)", fontSize: "1rem" }} />
              <input
                type="text"
                placeholder="Busca tu pregunta aquí…"
                value={search}
                onChange={e => { setSearch(e.target.value); setOpenIndex(null); }}
                style={{
                  width: "100%", padding: "16px 16px 16px 50px", borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.12)",
                  color: "#fff", fontSize: "1rem", outline: "none", backdropFilter: "blur(10px)",
                }}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ── FAQ CONTENT ── */}
      <section className="section-py" style={{ background: "var(--clr-bg)" }}>
        <Container>
          {/* Tabs de categorías */}
          <div className="d-flex flex-wrap gap-2 justify-content-center mb-5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCat(cat.id); setOpenIndex(null); }}
                style={{
                  padding: "9px 20px", borderRadius: "100px", border: "1px solid",
                  borderColor: activeCat === cat.id ? "#1800ad" : "var(--clr-border)",
                  background: activeCat === cat.id ? "#1800ad" : "var(--clr-bg-surface)",
                  color: activeCat === cat.id ? "#fff" : "var(--clr-muted)",
                  fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <i className={`bi ${cat.icon}`} style={{ fontSize: "0.85rem" }} />
                {cat.label}
                <span style={{
                  fontSize: "0.68rem", background: activeCat === cat.id ? "rgba(255,255,255,0.2)" : "var(--clr-primary-alpha)",
                  color: activeCat === cat.id ? "#fff" : "#1800ad", padding: "1px 7px", borderRadius: "100px",
                }}>
                  {cat.id === "all" ? faqs.length : faqs.filter(f => f.cat === cat.id).length}
                </span>
              </button>
            ))}
          </div>

          <Row>
            <Col lg={8} className="mx-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-search" style={{ fontSize: "3rem", color: "var(--clr-border)", display: "block", marginBottom: "16px" }} />
                  <h5 style={{ fontWeight: 700, color: "var(--clr-text-head)" }}>No encontramos resultados</h5>
                  <p style={{ color: "var(--clr-muted)" }}>Intenta con otras palabras o <a href="/contacto" style={{ color: "#1800ad", fontWeight: 700 }}>contáctanos directamente</a>.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filtered.map((faq, i) => {
                    const catInfo = categories.find(c => c.id === faq.cat);
                    return (
                      <div
                        key={i}
                        style={{
                          background: "var(--clr-bg-surface)", border: `1px solid ${openIndex === i ? "#1800ad" : "var(--clr-border)"}`,
                          borderRadius: "20px", overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
                          boxShadow: openIndex === i ? "0 8px 24px rgba(24,0,173,0.08)" : "none",
                        }}
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                      >
                        <div className="d-flex justify-content-between align-items-start p-4">
                          <div className="d-flex align-items-start gap-3 flex-grow-1">
                            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "var(--clr-primary-alpha)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                              <i className={`bi ${catInfo?.icon}`} style={{ color: "#1800ad", fontSize: "0.85rem" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "#1800ad", marginBottom: "5px" }}>
                                {catInfo?.label}
                              </div>
                              <h6 style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "var(--clr-text-head)", lineHeight: 1.4 }}>{faq.q}</h6>
                            </div>
                          </div>
                          <i className={`bi bi-chevron-${openIndex === i ? "up" : "down"}`} style={{ color: "#1800ad", fontSize: "1rem", flexShrink: 0, marginLeft: "16px", marginTop: "8px" }} />
                        </div>
                        {openIndex === i && (
                          <div style={{ padding: "0 24px 24px 24px", borderTop: "1px solid var(--clr-border)", paddingTop: "18px" }}>
                            <p style={{ margin: 0, color: "var(--clr-text)", lineHeight: 1.8, fontSize: "0.95rem" }}>{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── RECURSOS DE AYUDA ── */}
      <section className="section-py" style={{ background: "var(--clr-bg-light)" }}>
        <Container>
          <div className="text-center mb-5">
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
              Más recursos de <span style={{ color: "var(--clr-primary)" }}>ayuda</span>
            </h2>
            <p className="text-muted mt-2" style={{ fontSize: "1rem" }}>Explora otras formas de resolver tus dudas y aprender a usar SIERCP.</p>
          </div>
          <Row className="g-4 justify-content-center">
            {helpTopics.map((t, i) => (
              <Col key={i} md={6} lg={3}>
                <a href={t.href} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", padding: "28px 24px", textAlign: "center", height: "100%", transition: "all 0.25s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#1800ad"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--clr-border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ width: "52px", height: "52px", background: "var(--clr-primary-alpha)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <i className={`bi ${t.icon}`} style={{ color: "#1800ad", fontSize: "1.4rem" }} />
                    </div>
                    <h6 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "8px" }}>{t.title}</h6>
                    <p style={{ fontSize: "0.85rem", color: "var(--clr-muted)", margin: 0, lineHeight: 1.6 }}>{t.desc}</p>
                  </div>
                </a>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── CTA ¿No encontraste tu respuesta? ── */}
      <section style={{ background: "var(--clr-primary)", padding: "80px 0" }}>
        <Container>
          <div className="text-center">
            <div style={{ width: "64px", height: "64px", background: "rgba(255,255,255,0.15)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "1.8rem", color: "#fff" }}>
              <i className="bi bi-chat-dots" />
            </div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: "#fff", marginBottom: "16px" }}>
              ¿No encontraste lo que buscabas?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", marginBottom: "36px", maxWidth: "480px", margin: "0 auto 36px" }}>
              Nuestro equipo de soporte está disponible para responder cualquier pregunta específica sobre tu institución o caso de uso.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="btn-brand-on-dark" style={{ padding: "13px 28px", borderRadius: "12px" }}>
                <i className="bi bi-whatsapp me-2" />Preguntar por WhatsApp
              </a>
              <a href="/contacto" className="btn-outline-on-dark" style={{ padding: "13px 28px", borderRadius: "12px" }}>
                <i className="bi bi-envelope me-2" />Enviar Consulta
              </a>
            </div>
          </div>
        </Container>
      </section>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}