'use client';

import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";

const contactItems = [
  { icon: "bi-geo-alt", title: "Ubicación", value: "Valledupar, Cesar", desc: "Sede principal Jomar Segurid" },
  { icon: "bi-whatsapp", title: "WhatsApp", value: "+57 300 000 0000", href: "https://wa.me/573000000000", desc: "Respuesta inmediata" },
  { icon: "bi-envelope", title: "Email", value: "info@jomarsegurid.co", href: "mailto:info@jomarsegurid.co", desc: "Consultas técnicas" },
  { icon: "bi-clock", title: "Horario", value: "Lun–Vie: 7AM–6PM", desc: "Sábados: 8AM–2PM" },
];

export default function Contacto() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [status, setStatus] = useState<null | 'ok'>(null);
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
    setStatus("ok");
  };

  return (
    <section id="contacto" ref={ref} className="section-py" style={{ background: "var(--clr-bg)", position: "relative" }}>
      <Container>
        <Row className="mb-5">
          <Col lg={7} className={`fade-up ${isVisible ? "visible" : ""}`}>
            <span className="badge-pill mb-3">Soporte & Consultoría</span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)", lineHeight: 1.15 }}>
              ¿Listo para dar el <span style={{ color: 'var(--clr-primary)' }}>siguiente paso</span>?
            </h2>
            <p className="mt-4" style={{ fontSize: "1.05rem", maxWidth: "600px" }}>
              Nuestro equipo de expertos está listo para asesorarte en la implementación de programas de formación y tecnología clínica.
            </p>
          </Col>
        </Row>

        <Row className="g-5 align-items-stretch">
          {/* Support Terminal */}
          <Col lg={5}>
            <div className={`fade-in-left h-100 ${isVisible ? "visible" : ""}`}>
              <div className="d-flex flex-column gap-3 h-100">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  {contactItems.map((item, i) => (
                    <div key={i} className="card-brand p-4" style={{
                      background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px"
                    }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        background: "var(--clr-primary-alpha)", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "var(--clr-primary)",
                        marginBottom: "15px"
                      }}>
                        <i className={`bi ${item.icon}`} />
                      </div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "1px" }}>{item.title}</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--clr-text)", margin: "4px 0" }}>{item.value}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{item.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="p-4 mt-auto" style={{
                  background: "#1800ad", borderRadius: "24px", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div>
                    <h6 style={{ fontWeight: 800, margin: 0 }}>Canal de WhatsApp</h6>
                    <p style={{ fontSize: "0.8rem", margin: 0, opacity: 0.7 }}>Soporte técnico inmediato</p>
                  </div>
                  <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="btn-brand-on-dark py-2 px-4" style={{ borderRadius: "12px", fontSize: "0.8rem" }}>
                    Chatear Ahora
                  </a>
                </div>
              </div>
            </div>
          </Col>

          {/* Inquiry Console */}
          <Col lg={7}>
            <div className={`fade-in-right h-100 ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.2s" }}>
              <div className="card-brand p-4 p-md-5 h-100" style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px" }}>
                {!status ? (
                  <form onSubmit={handleSubmit}>
                    <Row className="g-4">
                      <Col md={6}>
                        <label className="text-xs uppercase tracking-widest font-bold text-[#64748b] mb-2 block ml-1">Nombre Completo</label>
                        <input type="text" className="input-brand" placeholder="Ej. Juan Pérez" required />
                      </Col>
                      <Col md={6}>
                        <label className="text-xs uppercase tracking-widest font-bold text-[#64748b] mb-2 block ml-1">Teléfono</label>
                        <input type="tel" className="input-brand" placeholder="Ej. 300 123 4567" required />
                      </Col>
                      <Col md={12}>
                        <label className="text-xs uppercase tracking-widest font-bold text-[#64748b] mb-2 block ml-1">Email Corporativo</label>
                        <input type="email" className="input-brand" placeholder="juan@empresa.com" required />
                      </Col>
                      <Col md={12}>
                        <label className="text-xs uppercase tracking-widest font-bold text-[#64748b] mb-2 block ml-1">Mensaje / Requerimiento</label>
                        <textarea className="input-brand" rows={4} placeholder="Describe brevemente tu solicitud..." required style={{ resize: "none" }} />
                      </Col>
                      <Col md={12} className="mt-4">
                        <button type="submit" className="btn-brand w-100 py-3" style={{ borderRadius: "14px", fontSize: "1rem" }}>
                          Enviar Solicitud <i className="bi bi-arrow-right ms-2" />
                        </button>
                      </Col>
                    </Row>
                  </form>
                ) : (
                  <div className="text-center py-5 h-100 d-flex flex-column justify-content-center align-items-center">
                    <div style={{ width: "64px", height: "64px", background: "var(--clr-primary)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", fontSize: "1.5rem" }}>
                      <i className="bi bi-check2" />
                    </div>
                    <h5 style={{ fontWeight: 800 }}>Solicitud Recibida</h5>
                    <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: "300px" }}>Gracias por confiar en Jomar Segurid. Te contactaremos en las próximas 24 horas.</p>
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
