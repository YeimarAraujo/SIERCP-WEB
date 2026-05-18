'use client';

import React, { useEffect, useRef, useState } from "react";
import "../../app/landing.css";

/* ── Estadísticas animadas del hero ──────────────────────────────────────── */
const stats = [
  { value: 20, suffix: "+", label: "Años de experiencia" },
  { value: 40, suffix: "", label: "Est. máx por grupo" },
  { value: 500, suffix: "+", label: "Profesionales formados" },
  { value: 98, suffix: "%", label: "Tasa de satisfacción" },
];

/* ── Hook: contador animado al entrar en pantalla ─────────────────────────── */
function useCountUp(target: number, duration = 1800, active: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);

  return count;
}

/* ── Tarjeta de stat individual con contador ──────────────────────────────── */
function StatCounter({ value, suffix, label, active }: { value: number; suffix: string; label: string; active: boolean }) {
  const count = useCountUp(value, 1600, active);
  return (
    <div className="hero-stat-item">
      <div className="hero-stat-value">
        {count}{suffix}
      </div>
      <div className="hero-stat-label">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE HERO PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  /* ── Animación de entrada escalonada ──────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /* ── Activar contadores al hacer scroll ──────────────────────────────── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  /* ── Efecto parallax sutil en scroll ──────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      if (videoRef.current) {
        videoRef.current.style.transform = `scale(1.08) translateY(${scrollY * 0.25}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Scroll suave al hacer click en el indicador ─────────────────────── */
  const scrollToNext = () => {
    const next = sectionRef.current?.nextElementSibling as HTMLElement | null;
    next?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="hero-section"
    >
      {/* ── VIDEO DE FONDO ──────────────────────────────────────────────── */}
      <div className="hero-video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          className={`hero-video ${videoReady ? "hero-video--ready" : ""}`}
        >
          <source src="/assets/RCP_Hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay en capas: oscurecimiento + gradiente brand */}
        <div className="hero-overlay hero-overlay--dark" />
        <div className="hero-overlay hero-overlay--brand" />
        <div className="hero-overlay hero-overlay--vignette" />
        {/* Ruido de textura sutil */}
        <div className="noise-overlay" />
      </div>

      {/* ── FONDO ANIMADO (orbs dinámicos) ─────────────────────────────── */}
      <div className="hero-orb hero-orb--1" />
      <div className="hero-orb hero-orb--2" />
      <div className="hero-orb hero-orb--3" />

      {/* ── LÍNEAS DECORATIVAS ─────────────────────────────────────────── */}
      <div className="hero-grid-lines" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="hero-grid-line" style={{ left: `${(i + 1) * 16.66}%` }} />
        ))}
      </div>

      {/* ── CONTENIDO PRINCIPAL ────────────────────────────────────────── */}
      <div className="hero-content">
        <div className="container-fluid px-4 px-md-5" style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Badge animado */}
          <div className={`hero-badge-wrapper ${entered ? "hero-anim--badge" : ""}`}>
            <div className="hero-badge-live">
              <span className="hero-badge-dot" />
              <span>En vivo · AHA 2025</span>
            </div>
            <div className="hero-badge-sep" />
            <span className="hero-badge-text">
              <i className="bi bi-shield-check" /> 20 Años Protegiendo el Caribe Colombiano
            </span>
          </div>

          {/* Título principal con efecto de revelación */}
          <h1 className={`hero-h1 ${entered ? "hero-anim--title" : ""}`}>
            <span className="hero-h1-line" style={{ animationDelay: "0.1s" }}>
              Líderes en{" "}
              <span className="hero-highlight">
                Simulación
                <svg className="hero-underline-svg" viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path d="M0,8 Q75,0 150,8 Q225,16 300,8" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </span>
            <span className="hero-h1-line" style={{ animationDelay: "0.22s" }}>
              de Grado{" "}
              <span className="hero-highlight-box">Clínico</span>
            </span>
          </h1>

          {/* Subtítulo */}
          <p className={`hero-subtitle ${entered ? "hero-anim--subtitle" : ""}`}>
            Transformamos la formación en emergencias mediante tecnología SIERCP
            de última generación y los más altos estándares <strong>AHA 2025</strong>.
            Certificación real, impacto real.
          </p>

          {/* CTAs */}
          <div className={`hero-ctas ${entered ? "hero-anim--cta" : ""}`}>
            <a href="/login" className="hero-btn-primary">
              <span className="hero-btn-bg" />
              <span className="hero-btn-content">
                <i className="bi bi-cpu-fill" />
                Acceder a SIERCP App
              </span>
              <span className="hero-btn-shine" />
            </a>
            <a href="/programas" className="hero-btn-secondary">
              <i className="bi bi-play-circle-fill" />
              Ver Programas
            </a>
          </div>

          {/* Indicadores de confianza */}
          <div className={`hero-trust ${entered ? "hero-anim--trust" : ""}`}>
            <div className="hero-trust-item">
              <i className="bi bi-patch-check-fill" style={{ color: "#6d4aff" }} />
              <span>Certificado AHA</span>
            </div>
            <div className="hero-trust-divider" />
            <div className="hero-trust-item">
              <i className="bi bi-shield-lock-fill" style={{ color: "#6d4aff" }} />
              <span>Pago 100% Seguro</span>
            </div>
            <div className="hero-trust-divider" />
            <div className="hero-trust-item">
              <i className="bi bi-award-fill" style={{ color: "#6d4aff" }} />
              <span>Aval Internacional</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS FLOTANTES (bottom) ─────────────────────────────────────── */}
      <div className={`hero-stats-bar ${entered ? "hero-anim--stats" : ""}`}>
        <div className="hero-stats-inner">
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div className="hero-stats-sep" />}
              <StatCounter value={s.value} suffix={s.suffix} label={s.label} active={statsVisible} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── CONTROLES DE VIDEO ──────────────────────────────────────────── */}
      <button
        className="hero-video-ctrl"
        onClick={toggleMute}
        aria-label={isMuted ? "Activar sonido" : "Silenciar"}
        title={isMuted ? "Activar sonido" : "Silenciar"}
      >
        <i className={`bi ${isMuted ? "bi-volume-mute-fill" : "bi-volume-up-fill"}`} />
      </button>

      {/* ── SCROLL INDICATOR ────────────────────────────────────────────── */}
      <button className="hero-scroll-indicator" onClick={scrollToNext} aria-label="Siguiente sección">
        <div className="hero-scroll-mouse">
          <div className="hero-scroll-wheel" />
        </div>
        <span>Explorar</span>
      </button>
    </section>
  );
}
