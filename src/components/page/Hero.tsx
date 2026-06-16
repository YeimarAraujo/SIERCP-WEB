'use client';

import React, { useEffect, useRef, useState } from "react";

/* ── Estadísticas animadas del hero ──────────────────────────────────────── */
const stats = [
  { value: 40, suffix: "", label: "Cupos por grupo" },
  { value: 100, suffix: "%", label: "Aprendizaje aplicado" },
  { value: 24, suffix: "/7", label: "Acompañamiento" },
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

  /* ── Mantener el DOM sincronizado con isMuted (React puede revertirlo) ── */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  /* ── Scroll suave al hacer click en el indicador ─────────────────────── */
  const scrollToNext = () => {
    const next = sectionRef.current?.nextElementSibling as HTMLElement | null;
    next?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.muted) {
      v.muted = false;
      v.volume = 1;
      setIsMuted(false);

      v.play().catch(() => {
        v.muted = true;
        setIsMuted(true);
      });
    } else {
      v.muted = true;
      setIsMuted(true);
    }
  };
  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="hero-section"
    >
      <div className="hero-video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          poster="/assets/hero-bg.jpeg"
          onCanPlay={() => setVideoReady(true)}
          className={`hero-video ${videoReady ? "hero-video--ready" : ""}`}
        >
          <source src="/assets/RCP_Hero.webm" type="video/webm" />
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


      {/* ── CONTENIDO PRINCIPAL ────────────────────────────────────────── */}
      <div className="hero-content">
        <div className="container-fluid" style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Título principal con efecto de revelación */}
          <h1 className={`hero-h1 ${entered ? "hero-anim--title" : ""}`}>
            <span className="hero-h1-line" style={{ animationDelay: "0.1s" }}>
              Conecta tu formación{" "}
              <span className="hero-highlight">
                a un sistema inteligente{" "}

              </span>
            </span>
            <span className="hero-h1-line" style={{ animationDelay: "0.1s" }}>
              de{" "}
              <span className="hero-highlight"> capacitación
                <svg className="hero-underline-svg" viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path d="M0,8 Q75,0 150,8 Q225,16 300,8" strokeWidth="3" fill="none" />
                </svg>
              </span>

            </span>
          </h1>

          {/* <p className={`hero-subtitle ${entered ? "hero-anim--subtitle" : ""}`}>
            Formación en RCP, primeros auxilios y emergencias bajo estándares AHA 2025,
            potenciada por SIERCP: simulación clínica con sensores IoT que miden la calidad
            de cada maniobra en tiempo real.
          </p> */}

          {/* CTAs */}
          <div className={`hero-ctas ${entered ? "hero-anim--cta" : ""}`}>
            <a href="/login" className="hero-btn-primary">
              <span className="hero-btn-bg" />
              <span className="hero-btn-content">
                <i className="bi bi-cpu-fill" />
                Acceder a SICAP
              </span>
              <span className="hero-btn-shine" />
            </a>
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
