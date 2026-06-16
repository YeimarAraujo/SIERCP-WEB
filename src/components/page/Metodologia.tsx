'use client';

import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Brain, GraduationCap, Zap, HeartPulse, RefreshCw, ArrowRight } from 'lucide-react';

const steps = [
  {
    n: "01",
    title: "Capacitación",
    text: "La capacitación convierte la intención en competencia. Con maniquíes inteligentes SICAP, cada maniobra se evalua y se corrige hasta dominar la técnica.",
    icon: GraduationCap,
    accent: "#10b981",
    accentAlpha: "rgba(16,185,129,0.12)",
    tag: "Tecnología IoT",
    tagColor: "#065f46",
    detail: "Formarse con estándares AHA/ERC y práctica real."
  },


  {
    n: "04",
    title: "Acción",
    text: "La acción de calidad es la que sostiene la vida. Y cada acción retroalimenta una nueva decisión: el ciclo continúa.",
    icon: HeartPulse,
    accent: "var(--aha-danger)",
    accentAlpha: "var(--aha-danger-bg)",
    tag: "ISO 9001 compatible",
    tagColor: "#78350f",
    detail: "Ejecutar maniobras de primeros auxilios de alta calidad que salvan vidas."
  },
  {
    n: "02",
    title: "Decisión",
    text: "Todo comienza con una decisión. Identificar un paro cardíaco y activar la cadena de supervivencia. La formación reduce el miedo a actuar: quien sabe, decide.",
    icon: Brain,
    accent: "var(--clr-primary)",
    accentAlpha: "var(--clr-primary-alpha)",
    tag: "Guías AHA 2025",
    tagColor: "#1800ad",
    detail: "Reconocer la emergencia y decidir actuar en segundos."
  },

  {
    n: "03",
    title: "Reacción",
    text: "La reacción es la formación hecha reflejo. Llamar, pedir un DEA, iniciar compresiones. Una persona capacitada reacciona con seguridad cuando importa.",
    icon: Zap,
    accent: "#f59e0b",
    accentAlpha: "rgba(245,158,11,0.12)",
    tag: "ISO 9001 compatible",
    tagColor: "#78350f",
    detail: "Activar la respuesta correcta sin dudar."
  }
];

const standards = [
  { label: "Profundidad", value: "5–6 cm", sub: "Compresión esternal adulto" },
  { label: "Frecuencia", value: "100–120", sub: "Compresiones por minuto" },
  { label: "Retroceso", value: "100%", sub: "Descompresión completa" },
  { label: "Ventilación", value: "30:2", sub: "Relación compr./ventil." },
];

export default function Metodologia() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
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
      id="metodologia"
      ref={ref}
      className="section-py"
      style={{
        background: "var(--clr-bg)",
        borderTop: "1px solid var(--clr-border)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(var(--clr-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--clr-border) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
      {/* Radial fade so the grid doesn't overwhelm */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, transparent 30%, var(--clr-bg) 100%)",
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <Row className="mb-5 align-items-end g-4">
          <Col lg={6} className={`fade-in-left ${isVisible ? "visible" : ""}`}>
            <h2 style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 900,
              color: "var(--clr-text-head)",
              lineHeight: 1.1,
              marginBottom: 0,
            }}>
              Cuatro nodos que{" "}
              <span style={{ color: "var(--clr-primary)" }}>salvan vidas</span>
            </h2>
          </Col>
          <Col lg={6} className={`fade-in-right ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.15s" }}>
            <p style={{
              fontSize: "1.05rem",
              color: "var(--clr-muted)",
              margin: 0,
              borderLeft: "3px solid var(--clr-primary)",
              paddingLeft: "24px",
              lineHeight: 1.75,
            }}>
              La metodología SICAP se basa en un ciclo continuo: <strong style={{ color: "var(--clr-text-head)", fontWeight: 800 }}>Decisión, Capacitación, Reacción y Acción.</strong>,
              Cada nodo alimenta al siguiente, formando una cadena que se fortalece con cada repetición.
            </p>
          </Col>
        </Row>

        {/* ── AHA Standards Bar ──
        <div
          className={`fade-up ${isVisible ? "visible" : ""}`}
          style={{
            transitionDelay: "0.2s",
            background: "var(--clr-bg-surface)",
            border: "1px solid var(--clr-border)",
            borderRadius: "16px",
            padding: "20px 28px",
            marginBottom: "48px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "var(--clr-primary-alpha)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="bi bi-heart-pulse-fill" style={{ color: "var(--clr-primary)", fontSize: "1rem" }} />
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", color: "var(--clr-muted)", letterSpacing: "0.08em" }}>Estándares AHA 2020–2025</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text-head)" }}>Parámetros de RCP de Alta Calidad</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {standards.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "var(--clr-bg)",
                  border: "1px solid var(--clr-border)",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  textAlign: "center",
                  minWidth: "110px",
                }}
              >
                <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--clr-primary)", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-head)", marginTop: "2px" }}>{s.label}</div>
                <div style={{ fontSize: "0.6rem", color: "var(--clr-muted)", marginTop: "1px" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div> */}

        {/* ── 3 Steps ── */}
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`fade-up ${isVisible ? "visible" : ""}`}
                style={{
                  transitionDelay: `${0.2 + i * 0.15}s`,
                  background: "var(--clr-bg-surface)",
                  border: `1px solid ${activeStep === i ? step.accent : "var(--clr-border)"}`,
                  borderRadius: "20px",
                  padding: "28px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "all 0.3s ease",
                  boxShadow: activeStep === i ? `0 8px 32px ${step.accent}22` : "var(--shadow-sm)",
                  cursor: "pointer",
                  zIndex: 1,
                }}
                onMouseEnter={() => setActiveStep(i)}
                onMouseLeave={() => setActiveStep(null)}
              >
                <div style={{
                  position: "absolute",
                  top: 0, left: "28px", right: "28px",
                  height: "3px",
                  borderRadius: "0 0 4px 4px",
                  background: step.accent,
                  opacity: activeStep === i ? 1 : 0.3,
                  transition: "opacity 0.3s ease",
                }} />

                {/* Icon + Number row */}
                <div className="d-flex align-items-center justify-content-between mb-4" style={{ marginTop: "8px" }}>
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "14px",
                    background: step.accentAlpha,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: step.accent,
                    transition: "transform 0.3s ease",
                    transform: activeStep === i ? "scale(1.2)" : "scale(1)",
                  }}>
                    <div>
                      <step.icon size={34} />
                    </div>
                  </div>
                  <span style={{
                    fontSize: "3rem",
                    fontWeight: 900,
                    color: "var(--clr-border)",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-2px",
                  }}>
                    {step.n}
                  </span>
                </div>

                {/* Tag */}
                {/* <div style={{ marginBottom: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: step.accentAlpha,
                    color: step.accent,
                  }}>
                    {step.tag}
                  </span>
                </div> */}

                <h4 style={{
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  marginBottom: "12px",
                  color: "var(--clr-text-head)",
                  lineHeight: 1.2,
                }}>
                  {step.title}
                </h4>

                <p style={{
                  fontSize: "0.9rem",
                  margin: 0,
                  lineHeight: 1.7,
                  color: "var(--clr-muted)",
                  flex: 1,
                }}>
                  {step.text}
                </p>

                {/* Bottom detail */}
                <div style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--clr-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <i className="bi bi-info-circle" style={{ color: step.accent, fontSize: "0.85rem" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--clr-muted)", fontWeight: 600 }}>{step.detail}</span>
                </div>
              </div>
            ))}

            {/* Centro del ciclo */}
            <div className="hidden lg:flex lg:row-span-2 lg:col-start-2 lg:row-start-1 items-center justify-center" >
              <div style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "var(--clr-primary)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                textAlign: "center",
              }}>
                <div className="text-center">
                  <RefreshCw size={26} className="mx-auto" />
                  <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide">Ciclo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-10">
            <p className="mt-10 text-center text-slate-500 max-w-2xl mx-auto">
              No es una línea recta, es un <strong className="text-brand-700">ciclo</strong>: cada acción
              genera aprendizaje que mejora la próxima decisión. Así formamos comunidades preparadas para responder.
            </p>
          </div>
        </div>



        {/* ── Bottom CTA Bridge → ProyectoIoT ── */}
        <div
          className={`fade-up ${isVisible ? "visible" : ""}`}
          style={{
            transitionDelay: "0.55s",
            background: "var(--clr-primary)",
            borderRadius: "24px",
            padding: "36px 40px",
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* BG decoration */}
          <div aria-hidden="true" style={{
            position: "absolute",
            right: "-60px", top: "-60px",
            width: "220px", height: "220px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }} />
          <div aria-hidden="true" style={{
            position: "absolute",
            right: "80px", bottom: "-80px",
            width: "160px", height: "160px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }} />

          <div style={{ position: "relative", zIndex: 1, maxWidth: "500px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "4px 12px",
              marginBottom: "12px",
            }}>
              <i className="bi bi-cpu" style={{ color: "#fff", fontSize: "0.75rem" }} />
              <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>Tecnología que lo hace posible</span>
            </div>
            <h3 style={{
              color: "#fff",
              fontWeight: 900,
              fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
              marginBottom: "8px",
              lineHeight: 1.2,
            }}>
              Conoce nuestra app SICAP
            </h3>
            <p style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.9rem",
              margin: 0,
              lineHeight: 1.6,
            }}>
              El sensor IoT que convierte cada compresión en un dato clínico medible.
              Sin subjetividad. Solo ciencia.
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <a
              href="#proyecto"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "#fff",
                color: "var(--clr-primary)",
                fontWeight: 800,
                fontSize: "0.95rem",
                padding: "14px 28px",
                borderRadius: "14px",
                textDecoration: "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
              }}
            >
              Ver la Tecnología
              <i className="bi bi-arrow-right" style={{ fontSize: "1.1rem" }} />
            </a>
          </div>
        </div>

      </Container>
    </section>
  );
}