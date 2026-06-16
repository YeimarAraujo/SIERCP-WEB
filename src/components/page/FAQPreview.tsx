'use client';
import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const faqs = [
  { q: "¿Qué es SICAP?", a: "SICAP es una plataforma integral de hardware (IoT) y software para el entrenamiento y certificación en reanimación cardiopulmonar y emergencias." },
  { q: "¿Necesito comprar maniquíes nuevos?", a: "Dependiendo del plan, puedes conectar sensores SICAP a maniquíes estándar existentes o adquirir nuestros modelos inteligentes ya integrados." },
  { q: "¿Los certificados son avalados internacionalmente?", a: "La plataforma genera certificados que demuestran el cumplimiento de las métricas AHA 2020/2025 de alta calidad." },
  { q: "¿Puedo usarlo sin conexión a internet?", a: "Sí, nuestra app móvil cuenta con tecnología de persistencia de datos y Bluetooth. Las sesiones se sincronizan automáticamente en la nube cuando recuperes la conexión." },
];

export default function FAQPreview() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section-py" style={{ background: "var(--clr-bg-light)" }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <div className="text-center mb-5">
              <span className="badge-pill mb-3">Soporte y Ayuda</span>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                Preguntas <span style={{ color: "var(--clr-primary)" }}>Frecuentes</span>
              </h2>
              <p className="mx-auto mt-3" style={{ fontSize: "1.05rem" }}>
                Respuestas rápidas a las dudas más comunes de nuestros clientes.
              </p>
            </div>

            <div className="d-flex flex-column gap-3">
              {faqs.map((faq, i) => (
                <div key={i} className="card-brand" style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                  <div className="d-flex justify-content-between align-items-center p-4">
                    <h5 style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--clr-text-head)" }}>{faq.q}</h5>
                    <i className={`bi bi-chevron-${openIndex === i ? 'up' : 'down'}`} style={{ color: "var(--clr-primary)" }} />
                  </div>
                  {openIndex === i && (
                    <div className="p-4 pt-0" style={{ borderTop: "1px solid var(--clr-border)", marginTop: "10px" }}>
                      <p style={{ margin: 0, color: "var(--clr-text)", lineHeight: 1.6 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-5">
              <a href="/faq" className="btn-brand" style={{ background: 'transparent', border: '1px solid var(--clr-border)', color: 'var(--clr-text-head) !important', padding: '12px 32px', borderRadius: '100px' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--clr-bg-surface)'; e.currentTarget.style.borderColor = 'var(--clr-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--clr-border)'; }}>
                Ver Centro de Ayuda Completo <i className="bi bi-arrow-right ms-2"></i>
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
