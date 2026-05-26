'use client';

import React, { useEffect, useRef, useState } from "react";

const APP_FEATURES = [
  {
    icon: "bi-activity",
    title: "Métricas en tiempo real",
    desc: "Profundidad, ritmo y recoil de cada compresión mientras practicas.",
    color: "#00d4aa",
  },
  {
    icon: "bi-person-video3",
    title: "Panel del instructor",
    desc: "Supervisa a todos tus alumnos simultáneamente desde un solo panel.",
    color: "#a78bfa",
  },
  {
    icon: "bi-bar-chart-steps",
    title: "Historial y progresión",
    desc: "Cada sesión queda registrada. Compara tu evolución y certifica tu nivel.",
    color: "#f59e0b",
  },
  {
    icon: "bi-shield-check",
    title: "Validación AHA 2025",
    desc: "Algoritmos clínicos evalúan automáticamente cada maniobra.",
    color: "#34d399",
  },
];

/* ── Mock de pantalla de app ── */
function AppScreen({ visible }: { visible: boolean }) {
  const [score, setScore] = useState(88);
  const [depth, setDepth] = useState(52);
  const [rate, setRate] = useState(109);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setDepth(52 + Math.round((Math.random() - 0.5) * 10));
      setRate(108 + Math.round((Math.random() - 0.5) * 14));
      setScore(s => Math.min(98, Math.max(70, s + Math.round((Math.random() - 0.48) * 2))));
      setCount(c => c + 2);
    }, 1400);
    return () => clearInterval(id);
  }, [visible]);

  const depthOk = depth >= 50 && depth <= 60;
  const rateOk = rate >= 100 && rate <= 120;
  const clr = score >= 85 ? "#34d399" : "#f59e0b";

  // Score ring
  const r = 28; const circ = 2 * Math.PI * r;
  const dash = visible ? circ * (1 - score / 100) : circ;

  return (
    /* Phone frame */
    <div style={{
      width: 220,
      height: 350,
      background: "#0b0f1a",
      borderRadius: 36,
      border: "6px solid #1a1f2e",
      boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Notch */}
      <div style={{ height: 28, background: "#060810", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 60, height: 10, background: "#0b0f1a", borderRadius: 8 }} />
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 16px 0", opacity: 0.4 }}>
        <span style={{ fontSize: 9, color: "#fff", fontFamily: "monospace", fontWeight: 700 }}>9:41</span>
        <span style={{ fontSize: 9, color: "#fff", fontFamily: "monospace" }}>BLE ●</span>
      </div>

      {/* Header */}
      <div style={{ padding: "10px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Sesión activa</div>
          <div style={{ fontSize: 11, color: "#fff", fontWeight: 800, marginTop: 1 }}>María Torres</div>
        </div>
        <div style={{
          fontSize: 9, fontWeight: 800, color: "#f87171", letterSpacing: 1,
          background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)",
          padding: "2px 7px", borderRadius: 20,
        }}>● LIVE</div>
      </div>

      {/* Score ring + compresiones */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px" }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={clr} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
            transform="rotate(-90 36 36)"
            style={{ transition: "stroke-dashoffset 1.4s ease, stroke 0.4s" }} />
          <text x="36" y="33" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" fontFamily="monospace">{visible ? score : "--"}</text>
          <text x="36" y="44" textAnchor="middle" fill={clr} fontSize="7" fontWeight="700">SCORE</text>
        </svg>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Compresiones</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: "monospace", lineHeight: 1, marginTop: 2 }}>{visible ? 120 + count : "--"}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 16px" }} />

      {/* Metric pills */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px" }}>
        {[
          { label: "Profundidad", value: depth, unit: "mm", ok: depthOk, color: "#00d4aa", pct: ((depth - 30) / (70 - 30)) * 100 },
          { label: "Ritmo", value: rate, unit: "cpm", ok: rateOk, color: "#f59e0b", pct: ((rate - 80) / (140 - 80)) * 100 },
        ].map(m => (
          <div key={m.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{m.label}</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: m.ok ? m.color : "#f87171", fontFamily: "monospace", transition: "color 0.3s" }}>
                {visible ? m.value : "--"}<span style={{ fontSize: 7, opacity: 0.6, marginLeft: 1 }}>{m.unit}</span>
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: visible ? `${m.pct}%` : "0%",
                background: m.ok ? m.color : "#f87171",
                transition: "width 0.55s ease, background 0.3s",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom feedback chip */}
      <div style={{ margin: "0 12px 16px", borderRadius: 14, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.18)", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <i className="bi bi-volume-up" style={{ color: "#00d4aa", fontSize: 12 }} />
        <span style={{ fontSize: 9, color: "#00d4aa", fontWeight: 700 }}>
          {depthOk && rateOk ? "¡Excelente técnica! Mantén el ritmo." : "Ajusta la profundidad."}
        </span>
      </div>

      {/* Home bar */}
      <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 6 }}>
        <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2 }} />
      </div>
    </div>
  );
}

/* ── Componente principal ── */
export default function ProyectoIoT() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} id="proyecto" style={{
      background: "var(--clr-bg-dark, #07090f)",
      padding: "clamp(72px, 10vw, 130px) 0",
      position: "relative", overflow: "hidden",
    }}>
      {/* Grid bg */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: "radial-gradient(rgba(0,212,170,0.05) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }} />
      {/* Glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,212,170,0.07) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", position: "relative", zIndex: 1 }}>

        {/* ── Encabezado centrado ── */}
        <div style={{
          textAlign: "center", marginBottom: "clamp(48px, 7vw, 88px)",
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)",
          transition: "all 0.8s ease",
        }}>
          <h2 style={{
            fontSize: "clamp(2rem, 4.5vw, 3.5rem)", fontWeight: 900,
            color: "#fff", lineHeight: 1.08,
            letterSpacing: "-1.5px", margin: "0 auto 20px",
          }}>
            Tu entrenamiento,<br />
            <span style={{ color: "var(--clr-primary)" }}>en tiempo real.</span>
          </h2>
          <p style={{
            color: "var(--clr-muted, rgba(255,255,255,0.42))",
            fontSize: "clamp(1rem, 1.5vw, 1.12rem)", lineHeight: 1.75,
            maxWidth: 520, margin: "0 auto",
          }}>
            La app SIERCP conecta el dispositivo con tu teléfono vía Bluetooth y convierte cada compresión en retroalimentación inmediata, visible para ti y tu instructor.
          </p>
        </div>

        {/* ── Layout central: phone + features ── */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "clamp(32px, 5vw, 64px)",
          alignItems: "center", justifyContent: "center",
        }}>

          {/* Phone mockup */}
          <div style={{
            opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(40px) scale(0.97)",
            transition: "all 0.9s cubic-bezier(.4,0,.2,1) 0.15s",
          }}>
            <AppScreen visible={visible} />
          </div>

          {/* Feature cards */}
          <div style={{
            flex: "1 1 280px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12, maxWidth: 520,
          }}>
            {APP_FEATURES.map((f, i) => (
              <div key={i} style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(24px)",
                transition: `all 0.65s ease ${0.25 + i * 0.1}s`,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "clamp(16px, 2.5vw, 22px)",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${f.color}15`, border: `1px solid ${f.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className={`bi ${f.icon}`} style={{ fontSize: "1.1rem", color: f.color }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#fff", marginBottom: 5 }}>{f.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA store badges ── */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center",
          marginTop: "clamp(40px, 6vw, 72px)",
          opacity: visible ? 1 : 0, transition: "opacity 1s ease 0.7s",
        }}>
          {[
            { icon: "bi-apple", label: "App Store", sub: "iOS" },
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

        {/* ── Hardware footnote ── */}
        <div style={{
          textAlign: "center", marginTop: "clamp(28px, 4vw, 48px)",
          opacity: visible ? 0.45 : 0, transition: "opacity 1.2s ease 0.9s",
          fontSize: "0.78rem", color: "rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap",
        }}>
          <i className="bi bi-cpu" style={{ fontSize: "0.85rem", color: "#00d4aa" }} />
          Impulsado por el dispositivo SIERCP — ESP-32 S3 · BLE 5.0 · 200 Hz · PCB v1.2
        </div>
      </div>

      <style>{`
        @keyframes sp-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(1.5); }
        }
      `}</style>
    </section>
  );
}