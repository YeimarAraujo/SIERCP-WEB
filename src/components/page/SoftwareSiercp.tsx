'use client';

import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";


const features = [
  {
    id: "dashboard",
    title: "Dashboard del Instructor",
    desc: "Control centralizado de hasta 12 maniquíes en tiempo real. Monitorea cada estación de RCP desde una sola pantalla con alertas automáticas.",
    icon: "bi-display",
    stats: [["Latencia", "<15ms"], ["Dispositivos", "12 Max"], ["Protocolo", "BLE 5.2"], ["Refresh", "60Hz"]]
  },
  {
    id: "app",
    title: "App del Estudiante",
    desc: "Feedback visual y auditivo instantáneo. El estudiante recibe correcciones precisas sobre profundidad, ritmo y liberación.",
    icon: "bi-phone-vibrate",
    stats: [["Precisión", "99.2%"], ["Muestreo", "200Hz"], ["Batería", "12h Cont."], ["Sync", "Auto"]]
  },
  {
    id: "analytics",
    title: "Reportes & Analítica",
    desc: "Generación automática de certificados y reportes detallados post-sesión alineados a los estándares AHA 2025.",
    icon: "bi-bar-chart-line",
    stats: [["Formato", "PDF/JSON"], ["Métricas", "AHA 2025"], ["Cloud", "Sync"], ["Storage", "AES-256"]]
  }
];

export default function SoftwareSiercp() {
  const [activeTab, setActiveTab] = useState(features[0]);
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
    <section id="software" ref={ref} className="section-py" style={{ background: "var(--clr-bg-light)", borderTop: "1px solid var(--clr-border)" }}>
      <Container style={{ position: "relative", zIndex: 1 }}>
        <Row className="mb-5">
          <Col lg={7} className={`fade-up ${isVisible ? "visible" : ""}`}>
            <span className="badge-pill-white mb-3">Ecosistema Digital</span>
            <h2 style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)", lineHeight: 1.1 }}>
              La Inteligencia detrás de <span style={{ color: 'var(--clr-primary)' }}>SIERCP</span>
            </h2>
          </Col>
        </Row>

        <Row className="g-5 align-items-center">
          <Col lg={5}>
            <div className={`fade-in-left ${isVisible ? "visible" : ""}`}>
              <div className="d-flex flex-column gap-2">
                {features.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setActiveTab(f)}
                    style={{
                      padding: "20px",
                      borderRadius: "16px",
                      background: activeTab.id === f.id ? "var(--clr-bg-surface)" : "transparent",
                      border: "1px solid var(--clr-border)",
                      borderColor: activeTab.id === f.id ? "rgba(255,255,255,0.2)" : "transparent",
                      cursor: "pointer",
                      transition: "var(--transition)"
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", color: "var(--clr-primary)", background: activeTab.id === f.id ? "var(--clr-primary-alpha)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className={`bi ${f.icon}`} />
                      </div>
                      <h5 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem" }}>{f.title}</h5>
                    </div>

                    {activeTab.id === f.id && (
                      <div className="mt-4" style={{ animation: "fadeInUp 0.4s ease" }}>
                        <p className="on-dark-text mb-4" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{f.desc}</p>

                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1px",
                          background: "rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.1)"
                        }}>
                          {f.stats.map(([label, val]) => (
                            <div key={label} style={{ background: "rgba(24,0,173,0.3)", padding: "10px 15px" }}>
                              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace", color: "#fff" }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Col>

          {/* <Col lg={7}>
            <div className={`fade-in-right ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.3s" }}>
              <div className="card-glass p-4 text-center" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-full h-[300px] md:h-[500px] bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden relative">

                  <img
                    src="/assets/img_sesion_siercp.png"
                    alt="SIERCP App Mockup"
                    className="img-fluid"
                    style={{
                      filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
                      transform: "rotate(-5deg) scale(1.1)",
                      transition: "transform 0.6s ease",
                    }}
                  />

                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]" />
                </div>
              </div>
            </div>
          </Col> */}
        </Row>
      </Container>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
