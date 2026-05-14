'use client';

import Footer from "@/components/page/Footer";
import Navbar from "@/components/page/Navbar";
import WhatsAppFab from "@/components/page/WhatsAppFab";
import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { contactItems, offices, responseTimes, faqs, reasons } from "@/data/contacto";

export default function ContactoPage() {
    const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "general", message: "" });
    const [status, setStatus] = useState<null | string>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) setIsVisible(true);
        }, { threshold: 0.05 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("ok");
    };

    const inputStyle = {
        width: "100%",
        padding: "13px 16px",
        borderRadius: "12px",
        border: "1px solid var(--clr-border)",
        background: "var(--clr-bg)",
        color: "var(--clr-text)",
        fontSize: "0.95rem",
        outline: "none",
        fontFamily: "var(--font-body)",
        transition: "all 0.2s ease",
    };

    return (
        <div ref={ref} style={{ background: "var(--clr-bg)" }}>
            <Navbar forceScrolled={true} />
            <section style={{
                background: "var(--clr-bg-hero)",
                padding: "120px 0 80px",
                position: "relative",
                overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(circle at 20% 50%, rgba(109,74,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)",
                    pointerEvents: "none",
                }} />
                <Container style={{ position: "relative", zIndex: 1 }}>
                    <Row className="align-items-center g-5">
                        <Col lg={6}>
                            <span className="badge-pill-white mb-4 d-inline-flex">
                                <i className="bi bi-chat-dots-fill" style={{ fontSize: "0.8rem" }} /> Soporte & Consultoría
                            </span>
                            <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 900, color: "#fff", lineHeight: 1.08, marginBottom: "24px" }}>
                                Estamos aquí para<br />
                                <span style={{ color: "#a5f3fc" }}>ayudarte a crecer</span>
                            </h1>
                            <p style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.75, marginBottom: "36px", maxWidth: "520px" }}>
                                Nuestro equipo de expertos en emergencias y tecnología clínica está disponible para asesorarte, resolver tus dudas e impulsar la formación en tu institución.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                {reasons.map((r, i) => (
                                    <div key={i} className="d-flex align-items-center gap-2" style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.15)" }}>
                                        <i className={`bi ${r.icon}`} style={{ color: "#a5f3fc", fontSize: "0.9rem" }} />
                                        <span style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 700 }}>{r.text}</span>
                                    </div>
                                ))}
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                {contactItems.map((item, i) => (
                                    <a key={i} href={item.href || "#"} style={{ textDecoration: "none" }}>
                                        <div style={{
                                            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                                            borderRadius: "20px", padding: "22px", transition: "all 0.25s ease",
                                            cursor: item.href ? "pointer" : "default",
                                        }}
                                            onMouseEnter={e => item.href && (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
                                            onMouseLeave={e => item.href && (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                                        >
                                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                                                <i className={`bi ${item.icon}`} style={{ color: "#fff", fontSize: "1.1rem" }} />
                                            </div>
                                            <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>{item.title}</div>
                                            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff", marginBottom: "3px" }}>{item.value}</div>
                                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{item.desc}</div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* ── FORMULARIO + MAPA ── */}
            <section className="section-py" style={{ background: "var(--clr-bg)" }}>
                <Container>
                    <Row className="g-5">
                        {/* Formulario */}
                        <Col lg={7}>
                            <div className={`fade-up ${isVisible ? "visible" : ""}`}>
                                <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "8px" }}>
                                    Envíanos un mensaje
                                </h2>
                                <p style={{ color: "var(--clr-muted)", marginBottom: "32px", fontSize: "1rem" }}>
                                    Completa el formulario y uno de nuestros asesores te contactará en menos de 24 horas.
                                </p>

                                {!status ? (
                                    <form onSubmit={handleSubmit}>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <label style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--clr-muted)", display: "block", marginBottom: "8px" }}>Nombre Completo *</label>
                                                <input
                                                    type="text" placeholder="Ej. Juan Pérez" required style={inputStyle}
                                                    onFocus={e => { e.target.style.borderColor = "#1800ad"; e.target.style.boxShadow = "0 0 0 3px rgba(24,0,173,0.08)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--clr-border)"; e.target.style.boxShadow = "none"; }}
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <label style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--clr-muted)", display: "block", marginBottom: "8px" }}>Teléfono / WhatsApp *</label>
                                                <input
                                                    type="tel" placeholder="300 123 4567" required style={inputStyle}
                                                    onFocus={e => { e.target.style.borderColor = "#1800ad"; e.target.style.boxShadow = "0 0 0 3px rgba(24,0,173,0.08)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--clr-border)"; e.target.style.boxShadow = "none"; }}
                                                />
                                            </Col>
                                            <Col md={12}>
                                                <label style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--clr-muted)", display: "block", marginBottom: "8px" }}>Correo Electrónico *</label>
                                                <input
                                                    type="email" placeholder="juan@empresa.com" required style={inputStyle}
                                                    onFocus={e => { e.target.style.borderColor = "#1800ad"; e.target.style.boxShadow = "0 0 0 3px rgba(24,0,173,0.08)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--clr-border)"; e.target.style.boxShadow = "none"; }}
                                                />
                                            </Col>
                                            <Col md={12}>
                                                <label style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--clr-muted)", display: "block", marginBottom: "8px" }}>Motivo de contacto *</label>
                                                <select
                                                    required style={{ ...inputStyle, cursor: "pointer" }}
                                                    onFocus={e => { e.target.style.borderColor = "#1800ad"; e.target.style.boxShadow = "0 0 0 3px rgba(24,0,173,0.08)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--clr-border)"; e.target.style.boxShadow = "none"; }}
                                                >
                                                    <option value="">Selecciona una opción…</option>
                                                    <option value="demo">Demo del Software SIERCP</option>
                                                    <option value="cursos">Información sobre Cursos y Programas</option>
                                                    <option value="empresa">Convenio Empresarial</option>
                                                    <option value="soporte">Soporte Técnico</option>
                                                    <option value="cotizacion">Cotización de Plan</option>
                                                    <option value="otro">Otro</option>
                                                </select>
                                            </Col>
                                            <Col md={12}>
                                                <label style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--clr-muted)", display: "block", marginBottom: "8px" }}>Institución / Empresa</label>
                                                <input
                                                    type="text" placeholder="Nombre de tu institución (opcional)" style={inputStyle}
                                                    onFocus={e => { e.target.style.borderColor = "#1800ad"; e.target.style.boxShadow = "0 0 0 3px rgba(24,0,173,0.08)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--clr-border)"; e.target.style.boxShadow = "none"; }}
                                                />
                                            </Col>
                                            <Col md={12}>
                                                <label style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--clr-muted)", display: "block", marginBottom: "8px" }}>Mensaje / Requerimiento *</label>
                                                <textarea
                                                    rows={5} placeholder="Cuéntanos brevemente qué necesitas. Mientras más detalle des, mejor podemos preparar nuestra respuesta..." required
                                                    style={{ ...inputStyle, resize: "vertical" }}
                                                    onFocus={e => { e.target.style.borderColor = "#1800ad"; e.target.style.boxShadow = "0 0 0 3px rgba(24,0,173,0.08)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--clr-border)"; e.target.style.boxShadow = "none"; }}
                                                />
                                            </Col>

                                            {/* Privacy note */}
                                            <Col md={12}>
                                                <p style={{ fontSize: "0.78rem", color: "var(--clr-muted)", lineHeight: 1.5 }}>
                                                    <i className="bi bi-shield-lock me-1" style={{ color: "#1800ad" }} />
                                                    Tus datos están protegidos bajo nuestra{" "}
                                                    <a href="/privacidad" style={{ color: "#1800ad", fontWeight: 700 }}>Política de Privacidad</a>.
                                                    No compartimos tu información con terceros.
                                                </p>
                                            </Col>

                                            <Col md={12} className="mt-2">
                                                <button type="submit" className="btn-brand w-100" style={{ padding: "16px", borderRadius: "14px", fontSize: "1rem", justifyContent: "center" }}>
                                                    <i className="bi bi-send-fill me-2" />
                                                    Enviar Solicitud
                                                </button>
                                                <div className="d-flex align-items-center justify-content-center gap-4 mt-4">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-clock" style={{ color: "var(--clr-muted)", fontSize: "0.85rem" }} />
                                                        <span style={{ fontSize: "0.8rem", color: "var(--clr-muted)" }}>Respuesta en &lt;24h</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-whatsapp" style={{ color: "#25D366", fontSize: "0.85rem" }} />
                                                        <span style={{ fontSize: "0.8rem", color: "var(--clr-muted)" }}>También por WhatsApp</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-shield-check" style={{ color: "#1800ad", fontSize: "0.85rem" }} />
                                                        <span style={{ fontSize: "0.8rem", color: "var(--clr-muted)" }}>Datos seguros</span>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </form>
                                ) : (
                                    <div className="text-center py-5" style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "60px 40px" }}>
                                        <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, #1800ad, #6d4aff)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "2rem", color: "#fff" }}>
                                            <i className="bi bi-check-lg" />
                                        </div>
                                        <h4 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "12px" }}>¡Solicitud Enviada!</h4>
                                        <p style={{ color: "var(--clr-muted)", maxWidth: "380px", margin: "0 auto 28px", lineHeight: 1.6 }}>
                                            Gracias por contactar a Jomar Segurid. Un asesor revisará tu solicitud y te responderá en menos de 24 horas hábiles.
                                        </p>
                                        <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#25D366", color: "#fff", padding: "12px 24px", borderRadius: "12px", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
                                            <i className="bi bi-whatsapp" />
                                            También puedes escribirnos por WhatsApp
                                        </a>
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Sidebar info */}
                        <Col lg={5}>
                            <div className={`fade-in-right ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.2s" }}>
                                {/* WhatsApp CTA */}
                                <div style={{ background: "linear-gradient(135deg, #1800ad, #3b1ff5)", borderRadius: "24px", padding: "32px", color: "#fff", marginBottom: "24px" }}>

                                    <h5 style={{ fontWeight: 900, marginBottom: "8px" }}>¿Necesitas respuesta inmediata?</h5>
                                    <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "20px", lineHeight: 1.6 }}>
                                        Nuestro canal de WhatsApp tiene tiempo de respuesta inferior a 2 horas en días hábiles. Para emergencias técnicas, respuesta en menos de 30 minutos.
                                    </p>
                                    <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#25D366", color: "#fff", padding: "12px 22px", borderRadius: "12px", textDecoration: "none", fontWeight: 800, fontSize: "0.9rem" }}>
                                        <i className="bi bi-whatsapp" /> Chatear Ahora
                                    </a>
                                </div>

                                {/* Sedes */}
                                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "28px", marginBottom: "24px" }}>
                                    <h6 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "20px", fontSize: "1rem" }}>
                                        Nuestras Sedes
                                    </h6>
                                    {offices.map((o, i) => (
                                        <div key={i} style={{ paddingBottom: i < offices.length - 1 ? "18px" : 0, marginBottom: i < offices.length - 1 ? "18px" : 0, borderBottom: i < offices.length - 1 ? "1px solid var(--clr-border)" : "none" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                                <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--clr-text-head)" }}>{o.city}</span>
                                                {i === 0 && <span style={{ fontSize: "0.6rem", background: "rgba(24,0,173,0.1)", color: "#1800ad", padding: "2px 8px", borderRadius: "100px", fontWeight: 800, textTransform: "uppercase" }}>Principal</span>}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)", lineHeight: 1.7 }}>
                                                <div><i className="bi bi-geo-alt me-1" />{o.address}</div>
                                                <div><i className="bi bi-telephone me-1" />{o.phone}</div>
                                                <div><i className="bi bi-envelope me-1" />{o.email}</div>
                                                <div><i className="bi bi-clock me-1" />{o.hours}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Tiempo de respuesta */}
                                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "28px" }}>
                                    <h6 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "18px", fontSize: "1rem" }}>
                                        Tiempos de Respuesta
                                    </h6>
                                    {[
                                        { canal: "WhatsApp", tiempo: "< 2 horas", color: "var(--clr-primary)" },
                                        { canal: "Email corporativo", tiempo: "< 24 horas", color: "var(--clr-primary)" },
                                        { canal: "Soporte técnico SIERCP", tiempo: "< 4 horas", color: "var(--clr-primary)" },
                                        { canal: "Emergencias técnicas", tiempo: "< 30 min", color: "var(--clr-primary)" },
                                    ].map((item, i) => (
                                        <div key={i} className="d-flex justify-content-between align-items-center" style={{ marginBottom: "12px" }}>
                                            <span style={{ fontSize: "0.85rem", color: "var(--clr-text)" }}>{item.canal}</span>
                                            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: item.color, background: `${item.color}15`, padding: "3px 10px", borderRadius: "100px" }}>{item.tiempo}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* ── FAQ ── */}
            <section className="section-py" style={{ background: "var(--clr-bg-light)" }}>
                <Container>
                    <div className="text-center mb-5">
                        <span className="badge-pill mb-3">Preguntas Frecuentes</span>
                        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                            Dudas sobre cómo <span style={{ color: "var(--clr-primary)" }}>contactarnos</span>
                        </h2>
                    </div>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="d-flex flex-column gap-3">
                                {faqs.map((faq, i) => (
                                    <div key={i} style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", overflow: "hidden", cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                        <div className="d-flex justify-content-between align-items-center p-4">
                                            <h6 style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "var(--clr-text-head)" }}>{faq.q}</h6>
                                            <i className={`bi bi-chevron-${openFaq === i ? "up" : "down"}`} style={{ color: "#1800ad", fontSize: "1rem", flexShrink: 0, marginLeft: "16px" }} />
                                        </div>
                                        {openFaq === i && (
                                            <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--clr-border)", paddingTop: "18px" }}>
                                                <p style={{ margin: 0, color: "var(--clr-text)", lineHeight: 1.75, fontSize: "0.95rem" }}>{faq.a}</p>
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
            <section style={{ background: "var(--clr-primary)", padding: "80px 0", color: "#fff" }}>
                <Container>
                    <div className="text-center">
                        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: "16px" }}>
                            ¿Prefieres que te llamemos nosotros?
                        </h2>
                        <p style={{ fontSize: "1.1rem", marginBottom: "36px", maxWidth: "500px", margin: "0 auto 36px" }}>
                            Deja tu número y un asesor te llama en el horario que prefieras, sin costo ni compromiso.
                        </p>
                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                            <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="btn-brand-on-dark" style={{ padding: "14px 30px", borderRadius: "14px", fontSize: "0.95rem" }}>
                                <i className="bi bi-whatsapp me-2" />Agendar Llamada
                            </a>
                            <a href="mailto:info@jomarsegurid.co" className="btn-outline-on-dark" style={{ padding: "14px 30px", borderRadius: "14px", fontSize: "0.95rem" }}>
                                <i className="bi bi-envelope me-2" />Enviar Email
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