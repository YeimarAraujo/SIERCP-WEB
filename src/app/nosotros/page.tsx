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
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />
                <Container style={{ position: "relative", zIndex: 1 }}>
                    <Row className="align-items-center g-5">
                        <Col lg={6}>
                            <span className="badge-pill-white mb-4 d-inline-flex"><i className="bi bi-award-fill" style={{ fontSize: "0.8rem" }} /> Quiénes Somos</span>
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
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                                {stats.map((n, i) => (
                                    <div key={i} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "24px 16px", textAlign: "center" }}>
                                        <i className={`bi ${n.icon}`} style={{ color: "#a5f3fc", fontSize: "1.4rem", display: "block", marginBottom: "10px" }} />
                                        <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                                            {isVisible ? n.big : "0"}{n.suffix}
                                        </div>
                                        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, margin: "8px 0 0" }}>{n.label}</p>
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* ── MISIÓN / VISIÓN ── */}
            <section className="section-py" style={{ background: "var(--clr-bg)" }}>
                <Container>
                    <Row className="g-4 justify-content-center">
                        {[
                            { icon: "bi-compass-fill", label: "Misión", color: "#1800ad", text: "Formar personas competentes en primeros auxilios, emergencias médicas y reanimación cardiopulmonar, utilizando metodologías basadas en evidencia científica y tecnología de punta, con el fin de aumentar la tasa de supervivencia ante situaciones de emergencia en Colombia y Latinoamérica." },
                            { icon: "bi-eye-fill", label: "Visión", color: "#6d4aff", text: "Ser el centro de formación en emergencias más innovador y reconocido de Latinoamérica al 2030, integrando tecnología IoT, inteligencia artificial y estándares internacionales AHA para transformar la cultura de respuesta ante emergencias en la región." },
                            { icon: "bi-gem", label: "Propuesta de Valor", color: "#10b981", text: "La única academia en Colombia que certifica en estándares AHA y otorga certificados digitales verificables en blockchain, con seguimiento IoT en tiempo real de la calidad de cada maniobra de RCP realizada por sus estudiantes." },
                        ].map((item, i) => (
                            <Col key={i} md={4}>
                                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "36px 28px", height: "100%" }}>
                                    <div style={{ width: "52px", height: "52px", background: `${item.color}15`, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                                        <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: "1.4rem" }} />
                                    </div>
                                    <h4 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "14px", fontSize: "1.2rem" }}>{item.label}</h4>
                                    <p style={{ color: "var(--clr-text)", lineHeight: 1.75, fontSize: "0.95rem", margin: 0 }}>{item.text}</p>
                                </div>
                            </Col>
                        ))}
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

            {/* ── VALORES ── */}
            <section className="section-py" style={{ background: "var(--clr-bg)" }}>
                <Container>
                    <div className="text-center mb-5">
                        <span className="badge-pill mb-3">Lo que nos mueve</span>
                        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                            Nuestros <span style={{ color: "var(--clr-primary)" }}>Valores</span>
                        </h2>
                    </div>
                    <Row className="g-4">
                        {values.map((v, i) => (
                            <Col key={i} md={6} lg={4}>
                                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "32px", height: "100%", transition: "all 0.3s ease" }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.08)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                                    <div style={{ width: "52px", height: "52px", background: `${v.color}15`, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                                        <i className={`bi ${v.icon}`} style={{ color: v.color, fontSize: "1.4rem" }} />
                                    </div>
                                    <h5 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "12px" }}>{v.title}</h5>
                                    <p style={{ color: "var(--clr-muted)", fontSize: "0.92rem", lineHeight: 1.75, margin: 0 }}>{v.desc}</p>
                                </div>
                            </Col>
                        ))}
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