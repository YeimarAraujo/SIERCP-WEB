'use client';

import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

// ── Video data ────────────────────────────────────────────────────────────────
// Replace `youtubeId` values with real YouTube video IDs when published.
// The thumbnail will fall back to the YouTube auto-generated image.

const VIDEOS = [
  {
    id: "intro",
    youtubeId: "dQw4w9WgXcQ",          // placeholder — replace with real ID
    title: "¿Qué es SIERCP?",
    desc: "Conoce el sistema inteligente de entrenamiento en RCP y cómo funciona el maniquí IoT.",
    duration: "2:34",
    tag: "Introducción",
    tagColor: "var(--clr-primary)",
  },
  {
    id: "app",
    youtubeId: "dQw4w9WgXcQ",
    title: "Primeros pasos con la App Móvil",
    desc: "Descarga la aplicación, conéctate al maniquí por BLE y revisa tus métricas en tiempo real.",
    duration: "3:12",
    tag: "App Móvil",
    tagColor: "#10b981",
  },
  {
    id: "session",
    youtubeId: "dQw4w9WgXcQ",
    title: "Cómo realizar una sesión de RCP",
    desc: "Guía paso a paso: configurar el escenario, practicar con feedback inmediato y revisar resultados.",
    duration: "4:50",
    tag: "Entrenamiento",
    tagColor: "#f59e0b",
  },
  {
    id: "certificado",
    youtubeId: "dQw4w9WgXcQ",
    title: "Obtén tu certificado digital",
    desc: "Así se genera automáticamente tu constancia al completar un curso con puntaje aprobatorio.",
    duration: "1:48",
    tag: "Certificación",
    tagColor: "#6366f1",
  },
];

// ── Thumbnail component ───────────────────────────────────────────────────────

function VideoCard({
  video,
  isActive,
  onClick,
}: {
  video: (typeof VIDEOS)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  const thumbUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: 16,
        overflow: "hidden",
        border: `2px solid ${isActive ? "var(--clr-primary)" : "rgba(255,255,255,0.08)"}`,
        background: isActive ? "rgba(24,0,173,0.12)" : "rgba(255,255,255,0.04)",
        transition: "all 0.2s ease",
        display: "flex",
        gap: 14,
        padding: "14px",
        alignItems: "center",
      }}
    >
      {/* Mini thumbnail */}
      <div style={{
        width: 80, height: 52, borderRadius: 8, overflow: "hidden",
        flexShrink: 0, position: "relative",
        background: "#0f0f2e",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt={video.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.35)",
        }}>
          <i className="bi bi-play-fill" style={{ color: "#fff", fontSize: "1rem" }} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "inline-block", fontSize: "0.6rem", fontWeight: 800,
          padding: "2px 8px", borderRadius: 20,
          background: `${video.tagColor}22`, color: video.tagColor,
          marginBottom: 4,
        }}>
          {video.tag}
        </div>
        <div style={{
          fontWeight: 700, fontSize: "0.82rem", color: "#fff",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
          {video.duration}
        </div>
      </div>

      {isActive && (
        <i className="bi bi-play-circle-fill" style={{ color: "var(--clr-primary)", fontSize: "1.1rem", flexShrink: 0 }} />
      )}
    </div>
  );
}


export default function VideoTutorial() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = VIDEOS[activeIdx];

  return (
    <section
      className="section-py"
      style={{ background: "#05070f", color: "#fff", position: "relative", overflow: "hidden" }}
    >
      {/* Ambient */}
      <div aria-hidden style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: "500px", height: "400px",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <Container style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <Row className="mb-5">
          <Col lg={7} className="mx-auto text-center">
            <h2 className="on-dark-title" style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 900, lineHeight: 1.1, marginBottom: 16,
            }}>
              Aprende a usar{" "}
              <span style={{ color: "var(--clr-primary)" }}>SIERCP en minutos</span>
            </h2>
            <p className="on-dark-text" style={{ opacity: 0.75, fontSize: "1rem", lineHeight: 1.75 }}>
              Video tutoriales cortos que cubren desde la configuración inicial
              hasta la descarga de certificados.
            </p>
          </Col>
        </Row>

        <Row className="g-4 align-items-start">

          {/* Main player */}
          <Col lg={7}>
            <div style={{
              borderRadius: 20, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0f0f2e",
              aspectRatio: "16/9",
              position: "relative",
            }}>
              <iframe
                key={active.youtubeId}
                src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?rel=0&modestbranding=1`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>

            {/* Current video meta */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 800, padding: "3px 10px",
                  borderRadius: 20, background: `${active.tagColor}22`, color: active.tagColor,
                }}>
                  {active.tag}
                </span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                  <i className="bi bi-clock" style={{ marginRight: 4 }} />{active.duration}
                </span>
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#fff", marginBottom: 8 }}>
                {active.title}
              </h3>
              <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.65, margin: 0 }}>
                {active.desc}
              </p>
            </div>
          </Col>

          {/* Playlist */}
          <Col lg={5}>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18, padding: 20,
            }}>
              <div style={{
                fontSize: "0.7rem", fontWeight: 800, color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14,
              }}>
                <i className="bi bi-collection-play" style={{ marginRight: 6 }} />
                {VIDEOS.length} videos — Lista de reproducción
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {VIDEOS.map((v, i) => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    isActive={i === activeIdx}
                    onClick={() => setActiveIdx(i)}
                  />
                ))}
              </div>

              {/* CTA */}
              <div style={{
                marginTop: 20, padding: "16px",
                borderRadius: 12, background: "rgba(24,0,173,0.15)",
                border: "1px solid rgba(24,0,173,0.3)",
                textAlign: "center",
              }}>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", margin: "0 0 12px" }}>
                  ¿Listo para empezar tu entrenamiento real?
                </p>
                <a
                  href="/programas"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "var(--clr-primary)", color: "#fff",
                    padding: "9px 20px", borderRadius: 10,
                    fontWeight: 800, fontSize: "0.85rem",
                    textDecoration: "none",
                  }}
                >
                  Ver programas <i className="bi bi-arrow-right" />
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
