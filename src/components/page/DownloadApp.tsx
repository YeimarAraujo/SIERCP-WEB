'use client';

import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from 'next/dynamic';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-white/10 w-full h-full rounded-2xl" />,
});

const appFeatures = [
  {
    icon: "bi-bluetooth",
    title: "Conexión BLE con maniquí",
    text: "Empareja el SIERCP en segundos. Los datos de compresión llegan en tiempo real durante el curso.",
    color: "#3b82f6",
  },
  {
    icon: "bi-bar-chart-line-fill",
    title: "Dashboard de métricas",
    text: "Frecuencia, profundidad y retroceso torácico visualizados en tiempo real. Tu progreso, siempre disponible.",
    color: "var(--clr-primary)",
  },
  {
    icon: "bi-patch-check-fill",
    title: "Certificados digitales",
    text: "Descarga tu constancia al finalizar el curso. Generada automáticamente desde los datos del maniquí.",
    color: "#10b981",
  },
  {
    icon: "bi-clock-history",
    title: "Historial de sesiones",
    text: "Revisa tu evolución en cada práctica. Identifica qué mejorar antes de tu evaluación final.",
    color: "#f59e0b",
  },
];

const metrics = [
  { label: "COMPRESIÓN", value: "50–60 mm", sub: "Profundidad óptima", color: "var(--clr-primary)" },
  { label: "FRECUENCIA", value: "100–120/min", sub: "Ritmo correcto", color: "#10b981" },
  { label: "CALIDAD", value: "80–100%", sub: "Score general", color: "#f59e0b" },
];

export default function DownloadApp() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="download"
      ref={ref}
      className="section-py"
      style={{
        background: "#05070f",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div aria-hidden="true" style={{
        position: "absolute",
        top: "-20%", left: "50%",
        transform: "translateX(-50%)",
        width: "800px", height: "400px",
        background: "radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Subtle grid */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        pointerEvents: "none",
      }} />

      <Container style={{ position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <Row className="mb-5">
          <Col lg={8} className={`fade-up ${isVisible ? "visible" : ""}`} style={{ margin: "0 auto", textAlign: "center" }}>
            <span className="badge-pill-white mb-3">Ecosistema Digital SIERCP</span>
            <h2 className="on-dark-title" style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "16px",
            }}>
              Tu Entrenamiento,{" "}
              <span className="text-accent">Siempre Contigo</span>
            </h2>
            <p className="on-dark-text" style={{
              fontSize: "1.05rem",
              lineHeight: 1.8,
              opacity: 0.8,
              maxWidth: "560px",
              margin: "0 auto",
            }}>
              La app móvil es la extensión digital de nuestros cursos. Conecta con el maniquí SIERCP
              durante las prácticas, guarda tus métricas y descarga tu certificado al finalizar.
            </p>
          </Col>
        </Row>

        {/* ── Main content: Features + 3D ── */}
        <Row className="align-items-center g-5">

          {/* Left: Features */}
          <Col lg={5} className={`fade-in-left ${isVisible ? "visible" : ""}`}>

            <div className="d-flex flex-column gap-3 mb-5">
              {appFeatures.map((f, i) => (
                <div
                  key={i}
                  style={{
                    background: activeFeature === i
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${activeFeature === i ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: "16px",
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    transform: activeFeature === i ? "translateX(4px)" : "translateX(0)",
                  }}
                  onMouseEnter={() => setActiveFeature(i)}
                  onMouseLeave={() => setActiveFeature(null)}
                >
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                    background: `${f.color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className={`bi ${f.icon}`} style={{ color: f.color, fontSize: "1.1rem" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#fff", marginBottom: "4px" }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      {f.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Download CTA */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "18px",
              padding: "24px",
            }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                Descarga gratuita — incluida con tu curso
              </div>

              <a
                href="#"
                className="btn-brand-on-dark py-3 px-4 d-inline-flex align-items-center gap-3 mb-3"
                style={{ borderRadius: "14px", minWidth: "220px", textDecoration: "none" }}
              >
                <i className="bi bi-google-play" style={{ fontSize: "1.4rem" }} />
                <div className="text-start">
                  <div style={{ fontSize: "0.58rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.7, lineHeight: 1 }}>Disponible en</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, lineHeight: 1.2 }}>Google Play</div>
                </div>
              </a>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <i className="bi bi-info-circle" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }} />
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  Disponible para estudiantes activos de cualquier curso SIERCP
                </span>
              </div>
            </div>

            {/* Secondary link */}
            <a
              href="/#proyecto"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "16px",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              Ver especificaciones técnicas del maniquí
              <i className="bi bi-arrow-right" />
            </a>
          </Col>

          {/* Right: 3D + floating chips */}
          <Col lg={7}>
            <div className={`fade-in-right ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.3s" }}>
              <div className="position-relative">

                {/* BLE chip */}
                <div className="card-glass p-3 position-absolute" style={{
                  top: "8%", right: "-3%", zIndex: 10, width: "185px",
                  animation: "float-chip-1 4s ease-in-out infinite",
                }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div style={{ position: "relative", width: "8px", height: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                      <div style={{
                        position: "absolute", inset: "-3px", borderRadius: "50%",
                        border: "2px solid #10b981", opacity: 0,
                        animation: "pulseDot 1.5s ease-in-out infinite",
                      }} />
                    </div>
                    <span style={{ fontSize: "0.62rem", fontWeight: 800 }}>CONECTADO BLE</span>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px" }}>
                    <div style={{ width: "85%", height: "100%", background: "#10b981", borderRadius: "2px" }} />
                  </div>
                  <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>
                    Maniquí SIERCP · Sesión activa
                  </div>
                </div>

                {/* Metric chips */}
                {metrics.map((m, i) => {
                  const positions = [
                    { bottom: "0%", right: "-3%", width: "185px", anim: "float-chip-1 4.5s ease-in-out infinite 0.5s" },
                    { bottom: "68%", left: "-10%", width: "165px", anim: "float-chip-3 3.5s ease-in-out infinite" },
                    { bottom: "18%", left: "-4%", width: "148px", anim: "float-chip-2 5s ease-in-out infinite" },
                  ];
                  const pos = positions[i];
                  return (
                    <div
                      key={i}
                      className="card-glass p-3 position-absolute"
                      style={{ zIndex: 10, animation: pos.anim, ...pos }}
                    >
                      <div style={{ fontSize: "0.58rem", fontWeight: 800, color: m.color, marginBottom: "4px", textTransform: "uppercase" }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>{m.value}</div>
                      <div style={{ fontSize: "0.6rem", opacity: 0.6 }}>{m.sub}</div>
                    </div>
                  );
                })}

                {/* 3D Scene */}
                <div style={{
                  width: "100%", height: "620px",
                  position: "relative",
                  borderRadius: "24px",
                  overflow: "hidden",
                  transition: "transform 0.6s ease",
                }}>
                  <Spline
                    scene="https://prod.spline.design/Ezjle9SHzmE4jhHK/scene.splinecode"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* ── Bottom context bar ── */}
        <div
          className={`fade-up ${isVisible ? "visible" : ""}`}
          style={{
            transitionDelay: "0.5s",
            marginTop: "56px",
            padding: "22px 32px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <i className="bi bi-mortarboard-fill" style={{ color: "var(--clr-primary)", fontSize: "1.3rem" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#fff" }}>
                ¿Aún no has tomado un curso con nosotros?
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                La app es parte del ecosistema. Empieza por el curso y obtén acceso completo.
              </div>
            </div>
          </div>
          <a
            href="#cursos"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "var(--clr-primary)",
              color: "#fff", fontWeight: 800, fontSize: "0.88rem",
              padding: "10px 22px", borderRadius: "12px",
              textDecoration: "none",
              transition: "opacity 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Ver cursos disponibles
            <i className="bi bi-arrow-right" />
          </a>
        </div>

      </Container>
    </section>
  );
}