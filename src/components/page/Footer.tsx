'use client';

import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const logo = "/assets/JOMAR/logoTextov2.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: "linear-gradient(180deg, #111827 0%, #0f1021 100%)",
      color: "rgba(255,255,255,0.6)",
      padding: "100px 0 40px",
      borderTop: "1px solid rgba(255,255,255,0.05)"
    }}>
      <Container>
        <Row className="g-5 mb-5">
          <Col lg={4}>
            <img src={logo} alt="Jomar Segurid" style={{ height: "55px", marginBottom: "28px", filter: "brightness(0) invert(1)" }} />
            <p style={{ fontSize: "0.95rem", lineHeight: "1.8", maxWidth: "340px", marginBottom: "32px" }}>
              Liderando la formación en emergencias y la innovación tecnológica clínica en el Caribe colombiano desde 2004.
            </p>
            <div className="d-flex gap-3">
              {[
                { icon: "instagram", href: "https://www.instagram.com/jomarsegurid/" },
                { icon: "facebook", href: "https://www.facebook.com/jomarsegurid/" },
                { icon: "linkedin", href: "https://www.linkedin.com/company/jomar-segurid/" },
                { icon: "whatsapp", href: "https://wa.me/573153778892" },
              ].map(({ icon: social, href }) => (
                <a key={social} href={href} target="_blank" rel="noreferrer" style={{
                  width: "42px", height: "42px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.03)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  color: "#fff", textDecoration: "none", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}
                >
                  <i className={`bi bi-${social}`} style={{ fontSize: "1.2rem" }} />
                </a>
              ))}

            </div>
          </Col>

          <Col md={4} lg={2}>
            <h6 style={{ color: "#fff", fontWeight: 800, marginBottom: "28px", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "1.5px" }}>Navegación</h6>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Inicio", href: "/" },
                { label: "Programas", href: "/programas" },
                { label: "Planes", href: "/planes" },
                { label: "Software SIERCP", href: "/acerca" },
                { label: "Nosotros", href: "/nosotros" },
                { label: "Contacto", href: "/contacto" },
              ].map(({ label, href }) => (
                <li key={label}><a href={href} style={{ color: "inherit", textDecoration: "none", fontSize: "0.9rem", transition: "all 0.2s ease" }}>{label}</a></li>
              ))}
            </ul>
          </Col>

          <Col md={4} lg={2}>
            <h6 style={{ color: "#fff", fontWeight: 800, marginBottom: "28px", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "1.5px" }}>Legal</h6>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Aviso de Privacidad", href: "/privacidad" },
                { label: "Términos de Uso", href: "/terminos" },
                { label: "Cookies", href: "/cookies" },
                { label: "Certificaciones", href: "/nosotros" },
              ].map(({ label, href }) => (
                <li key={label}><a href={href} style={{ color: "inherit", textDecoration: "none", fontSize: "0.9rem", transition: "all 0.2s ease" }}>{label}</a></li>
              ))}
            </ul>
          </Col>

          <Col md={4} lg={4}>
            <h6 style={{ color: "#fff", fontWeight: 800, marginBottom: "28px", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "1.5px" }}>Boletín de Innovación</h6>
            <p style={{ fontSize: "0.9rem", marginBottom: "24px" }}>Recibe actualizaciones sobre simulación clínica y protocolos AHA.</p>
            <form onSubmit={(e) => e.preventDefault()} style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="email@institucion.com"
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                  padding: "16px 20px", borderRadius: "14px", color: "#fff", outline: "none", fontSize: "0.9rem"
                }}
              />
              <button type="submit" style={{
                position: "absolute", right: "6px", top: "6px", bottom: "6px",
                background: "var(--clr-primary)", border: "none", borderRadius: "10px",
                color: "#fff", padding: "0 20px", fontWeight: 700, fontSize: "0.8rem",
                transition: "all 0.3s ease"
              }}>
                Suscribir
              </button>
            </form>
          </Col>
        </Row>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          fontSize: "0.8rem",
          letterSpacing: "0.5px"
        }}>
          <div>© {year} Jomar Segurid S.A.S. Todos los derechos reservados.</div>
          <div style={{ color: "rgba(255,255,255,0.3)" }}>
            Diseñado con precisión clínica en el Caribe colombiano.
          </div>
        </div>
      </Container>
    </footer>
  );
}
