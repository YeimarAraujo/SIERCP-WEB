'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col } from "react-bootstrap";
import {
  maniquiPackages, corporatePlans, sstConLicenciaPlans, sstSinLicenciaPlans,
  type ManiquiPackage, type Plan,
} from "../../data/planes";

const TABS = [
  { id: "corporativo", label: "Corporativo",      icon: "bi-building-fill",     subtitle: "Empresas · Hospitales · Instituciones" },
  { id: "maniquies",   label: "Maniquíes",         icon: "bi-heart-pulse-fill",  subtitle: "Compra de hardware IoT inteligente" },
  { id: "sst-con",     label: "SST Profesional",   icon: "bi-patch-check-fill",  subtitle: "Profesionales con licencia SST vigente" },
  { id: "sst-sin",     label: "Créditos",           icon: "bi-wallet2",           subtitle: "Sin licencia SST — pago por certificado" },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Sub-componente: card de paquete de maniquí ────────────────────────────
function ManiquiCard({ pkg, i, isVisible }: { pkg: ManiquiPackage; i: number; isVisible: boolean }) {
  const router = useRouter();
  const isContact = pkg.totalPriceCOP === null;
  return (
    <div className={`fade-up ${isVisible ? "visible" : ""} h-100`} style={{ transitionDelay: `${i * 0.1}s` }}>
      <div style={{
        background: pkg.highlight ? "#1800ad" : "var(--clr-bg-surface)",
        color: pkg.highlight ? "#fff" : "var(--clr-text)",
        border: pkg.highlight ? "2px solid #1800ad" : "1px solid var(--clr-border)",
        borderRadius: "28px", padding: "36px 30px", position: "relative", overflow: "hidden",
        transform: pkg.highlight ? "scale(1.03)" : "scale(1)",
        boxShadow: pkg.highlight ? "0 30px 70px rgba(24,0,173,0.22)" : "var(--shadow-sm)",
        height: "100%",
      }}>
        {pkg.badge && (
          <div style={{
            position: "absolute", top: "18px", right: "18px",
            background: pkg.highlight ? "rgba(255,255,255,0.2)" : "var(--clr-primary-alpha)",
            color: pkg.highlight ? "#fff" : "#1800ad",
            padding: "4px 12px", borderRadius: "100px",
            fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            {pkg.badge}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
            background: pkg.highlight ? "rgba(255,255,255,0.15)" : "var(--clr-primary-alpha)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className="bi bi-heart-pulse-fill" style={{ color: pkg.highlight ? "#a5f3fc" : "#1800ad", fontSize: "1.1rem" }} />
          </div>
          <h4 style={{ fontWeight: 900, fontSize: "1.4rem", margin: 0 }}>{pkg.name}</h4>
        </div>
        <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "20px", lineHeight: 1.5 }}>{pkg.desc}</p>

        {isContact ? (
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "1.9rem", fontWeight: 900 }}>Cotización</span>
            <div style={{ fontSize: "0.78rem", opacity: 0.6, marginTop: "4px" }}>
              +{pkg.discountPercent}% de descuento garantizado
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "4px" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1 }}>
              ${pkg.totalPriceCOP!.toLocaleString("es-CO")}
            </span>
            <span style={{ fontSize: "0.85rem", opacity: 0.6 }}> COP</span>
            {pkg.discountPercent > 0 && (
              <span style={{
                marginLeft: "10px",
                background: pkg.highlight ? "rgba(255,255,255,0.2)" : "#dcfce7",
                color: pkg.highlight ? "#a5f3fc" : "#16a34a",
                padding: "2px 10px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800,
              }}>
                {pkg.discountPercent}% OFF
              </span>
            )}
          </div>
        )}

        {!isContact && (
          <div style={{ fontSize: "0.75rem", opacity: 0.45, marginBottom: "20px" }}>
            ${pkg.unitPriceCOP.toLocaleString("es-CO")} COP/unidad · pago único
          </div>
        )}

        <button
          onClick={() => router.push("/contacto")}
          style={{
            width: "100%", padding: "13px", borderRadius: "14px", fontWeight: 800, fontSize: "0.95rem",
            cursor: "pointer", marginBottom: "24px", border: "none",
            background: pkg.highlight ? "#fff" : "#1800ad",
            color: pkg.highlight ? "#1800ad" : "#fff",
            transition: "all 0.2s ease",
          }}
        >
          {isContact ? "Solicitar cotización" : "Adquirir ahora"}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {pkg.includes.map((item, j) => (
            <div key={j} className="d-flex gap-2 align-items-start">
              <i className="bi bi-check-circle-fill" style={{
                fontSize: "0.9rem", flexShrink: 0, marginTop: "2px",
                color: pkg.highlight ? "#a5f3fc" : "#10b981",
              }} />
              <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente: card de plan de suscripción / créditos ────────────────
function PlanCard({ plan, i, isVisible }: { plan: Plan; i: number; isVisible: boolean }) {
  const router = useRouter();
  const annualMonthly = Math.round(plan.monthlyCOP * 0.7);
  const annualTotal = annualMonthly * 12;

  return (
    <div className={`fade-up ${isVisible ? "visible" : ""} h-100`} style={{ transitionDelay: `${i * 0.1}s` }}>
      <div style={{
        background: plan.highlight ? "#1800ad" : "var(--clr-bg-surface)",
        color: plan.highlight ? "#fff" : "var(--clr-text)",
        border: plan.highlight ? "2px solid #1800ad" : "1px solid var(--clr-border)",
        borderRadius: "28px", padding: "36px 30px", position: "relative", overflow: "hidden",
        transform: plan.highlight ? "scale(1.03)" : "scale(1)",
        boxShadow: plan.highlight ? "0 30px 70px rgba(24,0,173,0.22)" : "var(--shadow-sm)",
        height: "100%",
      }}>
        {plan.badge && (
          <div style={{
            position: "absolute", top: "18px", right: "18px",
            background: plan.highlight ? "rgba(255,255,255,0.2)" : "var(--clr-primary-alpha)",
            color: plan.highlight ? "#fff" : "#1800ad",
            padding: "4px 12px", borderRadius: "100px",
            fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            {plan.badge}
          </div>
        )}

        {plan.maniquiesIncluidos !== undefined && plan.maniquiesIncluidos > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px",
            background: plan.highlight ? "rgba(255,255,255,0.12)" : "var(--clr-primary-alpha)",
            padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700,
            color: plan.highlight ? "#a5f3fc" : "#1800ad",
          }}>
            <i className="bi bi-heart-pulse-fill" />
            {plan.maniquiesIncluidos} maniquí{plan.maniquiesIncluidos > 1 ? "es" : ""} incluido{plan.maniquiesIncluidos > 1 ? "s" : ""}
          </div>
        )}

        <h4 style={{ fontWeight: 900, fontSize: "1.4rem", marginBottom: "4px" }}>{plan.name}</h4>
        <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "20px", lineHeight: 1.5 }}>{plan.desc}</p>

        {plan.isContact ? (
          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "1.9rem", fontWeight: 900 }}>A medida</span>
            <div style={{ fontSize: "0.78rem", opacity: 0.6, marginTop: "4px" }}>Precio personalizado según tu organización</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "4px" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1 }}>
                ${plan.monthlyCOP.toLocaleString("es-CO")}
              </span>
              <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                {plan.isOneTime ? " COP · pago único" : "/mes COP"}
              </span>
            </div>
            {!plan.isOneTime && (
              <div style={{
                fontSize: "0.78rem", fontWeight: 800, marginBottom: "20px",
                background: plan.highlight ? "rgba(255,255,255,0.15)" : "var(--clr-primary-alpha)",
                color: plan.highlight ? "#a5f3fc" : "#1800ad",
                padding: "5px 12px", borderRadius: "8px", display: "inline-block",
              }}>
                <i className="bi bi-tag-fill me-1" />
                Anual: ${annualTotal.toLocaleString("es-CO")} COP (30% OFF)
              </div>
            )}
          </>
        )}

        <button
          onClick={() => router.push(plan.isContact ? "/contacto" : "/planes")}
          style={{
            width: "100%", padding: "13px", borderRadius: "14px", fontWeight: 800, fontSize: "0.95rem",
            cursor: "pointer", marginBottom: "24px", border: "none",
            background: plan.highlight ? "#fff" : "#1800ad",
            color: plan.highlight ? "#1800ad" : "#fff",
            transition: "all 0.2s ease",
          }}
        >
          {plan.isContact ? "Contactar ventas" : plan.isOneTime ? "Comprar créditos" : "Comenzar ahora"}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {plan.features.map((f, j) => (
            <div key={j} className="d-flex gap-2 align-items-center">
              <i
                className={f.included ? "bi bi-check-circle-fill" : "bi bi-x-circle"}
                style={{
                  fontSize: "0.9rem", flexShrink: 0,
                  color: f.included
                    ? (plan.highlight ? "#a5f3fc" : "#10b981")
                    : (plan.highlight ? "rgba(255,255,255,0.2)" : "var(--clr-border)"),
                }}
              />
              <span style={{ fontSize: "0.85rem", opacity: f.included ? 0.9 : 0.4 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function PlanesSiercp() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tab, setTab] = useState<TabId>("corporativo");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const activeTab = TABS.find(t => t.id === tab)!;

  const visibleManiquis  = maniquiPackages.slice(0, 3);
  const visibleCorp      = corporatePlans.slice(0, 3);
  const visibleSstCon    = sstConLicenciaPlans;
  const visibleSstSin    = sstSinLicenciaPlans;

  const currentPlans: Plan[] =
    tab === "corporativo" ? visibleCorp :
    tab === "sst-con"     ? visibleSstCon :
                            visibleSstSin;

  return (
    <section id="planes" ref={ref} className="section-py" style={{ background: "var(--clr-bg-light)" }}>
      <Container>
        {/* Header */}
        <div className={`text-center mb-5 fade-up ${isVisible ? "visible" : ""}`}>
          <span className="badge-pill mb-3">Software SIERCP</span>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
            Planes para cada <span style={{ color: "var(--clr-primary)" }}>necesidad</span>
          </h2>
          <p className="mx-auto mt-3" style={{ maxWidth: "560px", fontSize: "1.05rem", lineHeight: 1.7 }}>
            Desde hardware IoT hasta certificación profesional — elige la categoría que se adapta a ti.
          </p>
        </div>

        {/* Tab selector */}
        <div className={`fade-up ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.1s" }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center",
            background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)",
            borderRadius: "20px", padding: "8px", marginBottom: "12px",
          }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 18px", borderRadius: "14px", border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: "0.87rem", transition: "all 0.25s ease",
                  background: tab === t.id ? "#1800ad" : "transparent",
                  color: tab === t.id ? "#fff" : "var(--clr-text)",
                  display: "flex", alignItems: "center", gap: "8px",
                }}
              >
                <i className={`bi ${t.icon}`} style={{ fontSize: "0.9rem" }} />
                {t.label}
              </button>
            ))}
          </div>
          <p style={{ textAlign: "center", marginBottom: "40px", fontSize: "0.83rem", color: "var(--clr-muted)" }}>
            {activeTab.subtitle}
          </p>
        </div>

        {/* Cards */}
        <Row className="g-4 justify-content-center">
          {tab === "maniquies"
            ? visibleManiquis.map((pkg, i) => (
                <Col key={pkg.name} md={6} lg={4}>
                  <ManiquiCard pkg={pkg} i={i} isVisible={isVisible} />
                </Col>
              ))
            : currentPlans.map((plan, i) => (
                <Col key={plan.name} md={6} lg={4}>
                  <PlanCard plan={plan} i={i} isVisible={isVisible} />
                </Col>
              ))
          }
        </Row>

        {/* CTA */}
        <div className={`text-center mt-5 fade-up ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.4s" }}>
          <a
            href="/planes"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "transparent", border: "1px solid var(--clr-border)",
              color: "var(--clr-text-head)", padding: "12px 32px", borderRadius: "100px",
              fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#1800ad"; e.currentTarget.style.background = "var(--clr-bg-surface)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--clr-border)"; e.currentTarget.style.background = "transparent"; }}
          >
            Ver todos los planes <i className="bi bi-arrow-right" />
          </a>
        </div>
      </Container>
    </section>
  );
}
