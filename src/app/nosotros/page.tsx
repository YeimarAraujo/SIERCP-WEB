"use client";

import Footer from "@/components/page/Footer";
import Navbar from "@/components/page/Navbar";
import WhatsAppFab from "@/components/page/WhatsAppFab";
import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { missionCards, stats, timeline, values, team, alliances } from "@/data/nosostros";

export default function NosotrosPage() {
    const [isVisible, setIsVisible] = useState(false);
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
                padding: "120px 0 80px",
                position: "relative",
                overflow: "hidden",
            }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 18%, rgba(109,74,255,0.18) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(255,255,255,0.05) 0%, transparent 50%)", pointerEvents: "none" }} />
                <Container style={{ position: "relative", zIndex: 1 }}>
                    <Row className="align-items-center g-5">
                        <Col lg={6}>
                            <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: "24px" }}>
                                20 años formando<br /><span style={{ color: "#a5f3fc" }}>héroes anónimos</span>
                            </h1>
                            <p style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.75, marginBottom: "36px" }}>
                                Desde 2004, Jomar Segurid ha sido el referente en formación de emergencias en el Caribe colombiano. Hoy combinamos décadas de experiencia clínica con tecnología IoT de vanguardia para que cada persona que formamos sea capaz de salvar una vida.
                            </p>
                            <div className="d-flex gap-3 flex-wrap">
                                <a href="#historia" className="btn-brand-on-dark" style={{ padding: "13px 26px", borderRadius: "12px" }}>
                                    <i className="bi bi-clock-history me-2" />Nuestra Historia
                                </a>
                                <a href="#equipo" className="btn-outline-on-dark" style={{ padding: "13px 26px", borderRadius: "12px" }}>
                                    <i className="bi bi-people me-2" />Conoce al Equipo
                                </a>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.35)", lineHeight: 0 }}>
                                <img
                                    src="/assets/images/SICAP/webp/nosotros.webp"
                                    alt="Equipo de instructores de Jomar Segurid en formación de emergencias"
                                    className="img-fluid"
                                    style={{ display: "block", width: "100%", height: "auto" }}
                                />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* ── TIMELINE ── */}
            <section id="historia" className="section-py" style={{ background: "var(--clr-bg-light)" }}>
                <Container>
                    <div className="text-center mb-5">
                        <span className="badge-pill mb-3">Nuestra Trayectoria</span>
                        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                            Dos décadas de <span style={{ color: "var(--clr-primary)" }}>transformación</span>
                        </h2>
                        <p className="mx-auto mt-3" style={{ maxWidth: "540px", fontSize: "1.05rem", color: "var(--clr-text)" }}>
                            Cada hito en nuestra historia representa una promesa renovada con la vida humana.
                        </p>
                    </div>
                    <div style={{ position: "relative", maxWidth: "780px", margin: "0 auto" }}>
                        {/* Línea vertical */}
                        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px", background: "var(--clr-border)", transform: "translateX(-50%)" }} />
                        {timeline.map((t, i) => (
                            <div key={i} className="d-flex" style={{ marginBottom: "40px", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
                                <div style={{ width: "46%", background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", padding: "24px 28px", position: "relative" }}>
                                    {/* Punto en la línea */}
                                    <div style={{
                                        position: "absolute", top: "24px",
                                        [i % 2 === 0 ? "right" : "left"]: "-32px",
                                        width: "16px", height: "16px", borderRadius: "50%", background: "#1800ad", border: "3px solid var(--clr-bg-light)",
                                    }} />
                                    <div style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", color: "#1800ad", marginBottom: "6px" }}>{t.year}</div>
                                    <h6 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "10px", fontSize: "1.05rem" }}>{t.title}</h6>
                                    <p style={{ fontSize: "0.88rem", color: "var(--clr-muted)", lineHeight: 1.7, margin: 0 }}>{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* ── VALORES (layout editorial asimétrico) ── */}
            <section className="section-py" style={{ background: "var(--clr-bg)" }}>
                <Container>
                    <Row className="g-5">
                        {/* Intro a la izquierda (sticky) */}
                        <Col lg={4}>
                            <div style={{ position: "sticky", top: "110px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
                                    <span style={{ width: "36px", height: "2px", background: "var(--clr-primary)" }} />
                                    <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "var(--clr-primary)" }}>Lo que nos mueve</span>
                                </div>
                                <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "var(--clr-text-head)", lineHeight: 1.1, marginBottom: "20px" }}>
                                    Los principios que<br />no negociamos
                                </h2>
                                <p style={{ color: "var(--clr-muted)", fontSize: "1rem", lineHeight: 1.75, margin: 0 }}>
                                    No son frases de marketing: son las reglas que aplicamos en cada curso, protocolo y línea de código.
                                </p>
                            </div>
                        </Col>
                        {/* Lista editorial numerada */}
                        <Col lg={8}>
                            {values.map((v, i) => (
                                <div key={i}
                                    style={{ display: "flex", gap: "28px", padding: "30px 8px", borderTop: i === 0 ? "none" : "1px solid var(--clr-border)", transition: "all 0.25s ease", borderRadius: "16px" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--clr-bg-light)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--clr-primary)", opacity: 0.3, minWidth: "44px", lineHeight: 1.4 }}>
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                                            <i className={`bi ${v.icon}`} style={{ color: "var(--clr-primary)", fontSize: "1.2rem" }} />
                                            <h5 style={{ fontWeight: 800, color: "var(--clr-text-head)", margin: 0, fontSize: "1.2rem" }}>{v.title}</h5>
                                        </div>
                                        <p style={{ color: "var(--clr-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: 0, maxWidth: "560px" }}>{v.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* ── EQUIPO ── */}
            <section id="equipo" className="section-py" style={{ background: "var(--clr-bg-light)" }}>
                <Container>
                    <div className="text-center mb-5">
                        <span className="badge-pill mb-3">Detrás del escudo</span>
                        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                            El equipo que hace <span style={{ color: "var(--clr-primary)" }}>posible el cambio</span>
                        </h2>
                        <p className="mx-auto mt-3" style={{ maxWidth: "540px", fontSize: "1.05rem", color: "var(--clr-text)" }}>
                            Profesionales apasionados por la vida, con certificaciones de clase mundial.
                        </p>
                    </div>
                    <Row className="g-4 justify-content-center">
                        {team.map((m, i) => (
                            <Col key={i} md={6} lg={3}>
                                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "32px 24px", textAlign: "center", height: "100%" }}>
                                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `${m.color}20`, border: `3px solid ${m.color}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.4rem", fontWeight: 900, color: m.color }}>
                                        {m.initials}
                                    </div>
                                    <h6 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "4px", fontSize: "1rem" }}>{m.name}</h6>
                                    <p style={{ fontSize: "0.8rem", color: m.color, fontWeight: 800, marginBottom: "14px" }}>{m.role}</p>
                                    <p style={{ fontSize: "0.85rem", color: "var(--clr-muted)", lineHeight: 1.65, marginBottom: "16px" }}>{m.bio}</p>
                                    <div className="d-flex flex-column gap-2">
                                        {m.certs.map((c, j) => (
                                            <div key={j} style={{ fontSize: "0.7rem", background: "var(--clr-primary-alpha)", color: "var(--clr-primary)", padding: "4px 10px", borderRadius: "100px", fontWeight: 700 }}>
                                                <i className="bi bi-patch-check-fill me-1" />{c}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* ── ALIANZAS ── */}
            <section className="section-py" style={{ background: "var(--clr-bg)" }}>
                <Container>
                    <div className="text-center mb-5">
                        <span className="badge-pill mb-3">Respaldo institucional</span>
                        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                            Avalados por los mejores
                        </h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        {alliances.map((a, i) => (
                            <div key={i} style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", padding: "24px 20px", textAlign: "center", transition: "all 0.25s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#1800ad"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--clr-border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1800ad", marginBottom: "6px" }}>{a.abbr}</div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--clr-text-head)", marginBottom: "4px" }}>{a.name}</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{a.type}</div>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* ── CTA ── */}
            <section style={{ background: "var(--clr-primary)", padding: "80px 0" }}>
                <Container>
                    <Row className="align-items-center g-4">
                        <Col lg={8}>
                            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fff", margin: 0 }}>
                                ¿Quieres hacer parte de esta historia?
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", margin: "12px 0 0" }}>
                                Únete a las más de 500 personas que han transformado su capacidad de responder ante una emergencia.
                            </p>
                        </Col>
                        <Col lg={4} className="text-lg-end">
                            <div className="d-flex gap-3 flex-wrap justify-content-lg-end">
                                <a href="/contacto" className="btn-brand-on-dark" style={{ padding: "13px 26px", borderRadius: "12px" }}>
                                    Contáctanos
                                </a>
                                <a href="/programas" className="btn-outline-on-dark" style={{ padding: "13px 26px", borderRadius: "12px" }}>
                                    Ver Programas
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