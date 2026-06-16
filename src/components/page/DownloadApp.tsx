'use client';

import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const appFeatures = [
  {
    icon: "bi-bluetooth",
    title: "Conexión BLE con maniquí",
    text: "Empareja el SICAP en segundos. Los datos de compresión llegan en tiempo real durante el curso.",
    color: "#3b82f6",
  },
  {
    icon: "bi-bar-chart-line-fill",
    title: "Dashboard de métricas",
    text: "Frecuencia, profundidad y retroceso torácico visualizados en tiempo real. Tu progreso, siempre disponible.",
    color: "var(--clr-primary)",
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
  { label: "CALIDAD", value: "80–100%", sub: "Score general", color: "#f59e0b" },
  { label: "FRECUENCIA", value: "100–120/min", sub: "Ritmo correcto", color: "#10b981" },
];


/* ── Mock de pantalla de app ── */
function AppScreen({ visible }: { visible: boolean }) {
  const [score, setScore] = useState(88);
  const [depth, setDepth] = useState(52);
  const [rate, setRate] = useState(109);
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!visible) return;

    const id = setInterval(() => {
      const newDepth = 52 + Math.round((Math.random() - 0.5) * 10);
      const newRate = 108 + Math.round((Math.random() - 0.5) * 14);

      setScore((prev) => {
        const nextScore = Math.min(98, Math.max(70, prev + Math.round((Math.random() - 0.48) * 2)));

        setDepth(newDepth);
        setRate(newRate);
        setCount((c) => c + 1);

        setHistory((prevHistory) => {
          const nextIndex = prevHistory.length + 1;
          const now = new Date();

          const newEntry = {
            time: now.toLocaleTimeString("es-CO", {
              minute: "2-digit",
              second: "2-digit",
            }),
            depth: newDepth,
            rate: newRate,
            score: nextScore,
            idx: nextIndex,
          };

          return [...prevHistory, newEntry].slice(-20);
        });

        return nextScore;
      });
    }, 1400);

    return () => clearInterval(id);
  }, [visible]);

  const depthOk = depth >= 50 && depth <= 60;
  const rateOk = rate >= 100 && rate <= 120;
  const clr = score >= 85 ? "#34d399" : "#f59e0b";

  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = visible ? circ * (1 - score / 100) : circ;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.96)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "10px 12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
          {label}
        </div>
        {payload.map((entry: any) => (
          <div
            key={entry.dataKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: entry.color,
              }}
            />
            <span style={{ opacity: 0.75, minWidth: 80 }}>
              {entry.dataKey === "depth" ? "Profundidad" : "Frecuencia"}
            </span>
            <strong style={{ fontFamily: "monospace" }}>
              {entry.value} {entry.dataKey === "depth" ? "mm" : "cpm"}
            </strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        width: 300,
        background: "#0b0f1a",
        borderRadius: 36,
        border: "6px solid #1a1f2e",
        boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div style={{ height: 28, background: "#060810", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 60, height: 10, background: "#0b0f1a", borderRadius: 8 }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 16px 0", opacity: 0.4 }}>
        <span style={{ fontSize: 9, color: "#fff", fontFamily: "monospace", fontWeight: 700 }}>9:41</span>
        <span style={{ fontSize: 9, color: "#fff", fontFamily: "monospace" }}>BLE ●</span>
      </div>

      <div style={{ padding: "10px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            Sesión activa
          </div>
          <div style={{ fontSize: 11, color: "#fff", fontWeight: 800, marginTop: 1 }}>María Torres</div>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: "#f87171",
            letterSpacing: 1,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.2)",
            padding: "2px 7px",
            borderRadius: 20,
          }}
        >
          ● LIVE
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px" }}>
        <svg width="80" height="80" viewBox="0 0 72 72">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={clr}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            transform="rotate(-90 40 40)"
            style={{ transition: "stroke-dashoffset 1.4s ease, stroke 0.4s" }}
          />
          <text x="40" y="38" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" fontFamily="monospace">
            {visible ? score : "--"}
          </text>
          <text x="40" y="52" textAnchor="middle" fill={clr} fontSize="7" fontWeight="700">
            SCORE
          </text>
        </svg>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            Compresiones
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#fff",
              fontFamily: "monospace",
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            {visible ? 20 + count : "--"}
          </div>
        </div>
      </div>

      <div style={{ width: "100%", height: 160, minHeight: 160, padding: "8px 12px 6px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={history}
            margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="depthStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#00d4aa" />
              </linearGradient>
              <linearGradient id="rateStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              minTickGap={18}
            />
            <YAxis hide domain={[40, 130]} />
            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine y={50} stroke="rgba(34,197,94,0.35)" strokeDasharray="4 4" />
            <ReferenceLine y={60} stroke="rgba(34,197,94,0.35)" strokeDasharray="4 4" />
            <ReferenceLine y={100} stroke="rgba(245,158,11,0.25)" strokeDasharray="3 5" />
            <ReferenceLine y={120} stroke="rgba(245,158,11,0.25)" strokeDasharray="3 5" />

            <Line
              type="monotone"
              dataKey="depth"
              stroke="url(#depthStroke)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, stroke: "#0b0f1a", strokeWidth: 2, fill: "#00d4aa" }}
              isAnimationActive
              animationDuration={700}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="url(#rateStroke)"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4, stroke: "#0b0f1a", strokeWidth: 2, fill: "#f59e0b" }}
              isAnimationActive
              animationDuration={700}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 16px" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px" }}>
        {[
          { label: "Profundidad", value: depth, unit: "mm", ok: depthOk, color: "#00d4aa", pct: ((depth - 30) / (70 - 30)) * 100 },
          { label: "Ritmo", value: rate, unit: "cpm", ok: rateOk, color: "#f59e0b", pct: ((rate - 80) / (140 - 80)) * 100 },
        ].map((m) => (
          <div key={m.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                {m.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: m.ok ? m.color : "#f87171",
                  fontFamily: "monospace",
                  transition: "color 0.3s",
                }}
              >
                {visible ? m.value : "--"}
                <span style={{ fontSize: 7, opacity: 0.6, marginLeft: 1 }}>{m.unit}</span>
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  width: visible ? `${m.pct}%` : "0%",
                  background: m.ok ? m.color : "#f87171",
                  transition: "width 0.55s ease, background 0.3s",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          margin: "0 12px 16px",
          borderRadius: 14,
          background: "rgba(0,212,170,0.1)",
          border: "1px solid rgba(0,212,170,0.18)",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <i className="bi bi-volume-up" style={{ color: "#00d4aa", fontSize: 12 }} />
        <span style={{ fontSize: 9, color: "#00d4aa", fontWeight: 700 }}>
          {depthOk && rateOk ? "¡Excelente técnica! Mantén el ritmo." : "Ajusta la profundidad."}
        </span>
      </div>

      <div style={{ padding: "10px 16px" }}>
        <button
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.12)",
            color: "#f87171",
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          Finalizar sesión
        </button>
      </div>

      <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 6 }}>
        <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2 }} />
      </div>
    </div>
  );
}
export default function DownloadApp() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);

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
            <span className="badge-pill-white mb-3">Ecosistema Digital SICAP</span>
            <h2 className="on-dark-title" style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "16px",
            }}>
              Tu Entrenamiento,{" "}
              <span style={{ color: "var(--clr-primary)" }}>Siempre Contigo</span>
            </h2>
            <p className="on-dark-text" style={{
              fontSize: "1.05rem",
              lineHeight: 1.8,
              opacity: 0.8,
              maxWidth: "560px",
              margin: "0 auto",
            }}>
              La app móvil es la extensión digital de nuestros cursos. Conecta con el maniquí SICAP
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
            </div>{/* Download CTA */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 24,
                padding: "24px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
                backdropFilter: "blur(10px)",
                textAlign: "center",
                maxWidth: 760,
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.22)",
                  marginBottom: 14,
                }}
              >
                <i className="bi bi-patch-check-fill" style={{ color: "#34d399", fontSize: "0.9rem" }} />
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    color: "#a7f3d0",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Descarga gratuita incluida
                </span>
              </div>

              <div style={{
                display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: "10px",
                opacity: isVisible ? 1 : 0, transition: "opacity 1s ease 0.7s",
              }}>
                {[
                  /*{ icon: "bi-apple", label: "App Store", sub: "iOS" },*/
                  { icon: "bi-google-play", label: "Google Play", sub: "Android" },
                  { icon: "bi-display", label: "Dashboard Web", sub: "Instructor" },
                ].map(b => (
                  <div key={b.label} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 16, padding: "12px 22px", cursor: "pointer",
                    transition: "border-color 0.2s, background 0.2s",
                  }}>
                    <i className={`bi ${b.icon}`} style={{ fontSize: "1.3rem", color: "rgba(255,255,255,0.6)" }} />
                    <div>
                      <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{b.sub}</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#fff" }}>{b.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/*<a
                href="#"
                className="btn-brand-on-dark py-3 px-4 d-inline-flex align-items-center gap-3 mb-3"
                style={{ borderRadius: "14px", minWidth: "220px", textDecoration: "none" }}
              >
                <i className="bi bi-google-play" style={{ fontSize: "1.4rem" }} />
                <div className="text-start">
                  <div style={{ fontSize: "0.58rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.7, lineHeight: 1 }}>Disponible en</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, lineHeight: 1.2 }}>Google Play</div>
                </div>
              </a>*/}

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <i className="bi bi-info-circle" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }} />
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  Disponible para usuarios activos de cualquier curso.
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
                  top: "8%", right: "3%", zIndex: 10, width: "185px",
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
                    { bottom: "0%", right: "8%", width: "185px", anim: "float-chip-1 4.5s ease-in-out infinite 0.5s" },
                    { bottom: "68%", left: "10%", width: "165px", anim: "float-chip-3 3.5s ease-in-out infinite" },
                    { bottom: "18%", left: "8%", width: "148px", anim: "float-chip-2 5s ease-in-out infinite" },
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

                <div style={{
                  width: "100%",
                  height: "620px",
                  position: "relative",
                  borderRadius: "24px",
                  overflow: "hidden",
                  transition: "transform 0.6s ease",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{ transform: "scale(1)" }}>
                    <AppScreen visible={isVisible} />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/*         
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
        </div> */}

      </Container>
    </section >
  );
}