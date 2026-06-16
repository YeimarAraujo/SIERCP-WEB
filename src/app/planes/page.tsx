'use client';

import Footer from "@/components/page/Footer";
import Navbar from "@/components/page/Navbar";
import WhatsAppFab from "@/components/page/WhatsAppFab";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col } from "react-bootstrap";
import {
  maniquiPackages, corporatePlans, sstConLicenciaPlans, sstSinLicenciaPlans,
  comparisons, faqs, testimonials,
  type ManiquiPackage, type Plan,
} from "../../data/planes";
import {
  PricingPlanService,
  type PricingDoc,
} from "@/features/super-admin/services/plan.service";

const TABS = [
  { id: "corporativo", label: "Corporativo", icon: "bi-building-fill", subtitle: "Empresas · Hospitales · Instituciones" },
  { id: "maniquies", label: "Maniquíes", icon: "bi-heart-pulse-fill", subtitle: "Compra de hardware IoT inteligente" },
  { id: "sst-con", label: "SST con Licencia", icon: "bi-patch-check-fill", subtitle: "Profesionales con licencia SST vigente" },
  { id: "sst-sin", label: "SST sin Licencia", icon: "bi-wallet2", subtitle: "Sin licencia SST — pago por certificado" },
] as const;

type TabId = typeof TABS[number]["id"];

function getPlanRoute(plan: Plan): string {
  if (plan.isContact) return `/contacto?tipo=${plan.planCategory}&plan=${plan.slug}`;
  if (plan.planCategory === 'corporativo') return `/checkout/plan?plan=${plan.slug}`;
  if (plan.planCategory === 'sst-con') return `/checkout/licencia-sst?plan=${plan.slug}`;
  if (plan.planCategory === 'sst-sin') return `/checkout/pack?pack=${plan.slug}`;
  return '/contacto';
}

// ── ManiquiCard ───────────────────────────────────────────────────────────
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
          onClick={() => router.push(
            isContact
              ? `/contacto?tipo=maniqui&pack=${pkg.slug}`
              : `/checkout/manikin?pack=${pkg.slug}`
          )}
          style={{
            width: "100%", padding: "13px", borderRadius: "14px", fontWeight: 800, fontSize: "0.95rem",
            cursor: "pointer", marginBottom: "24px", border: "none",
            background: pkg.highlight ? "#fff" : "#1800ad", color: pkg.highlight ? "#1800ad" : "#fff",
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

// ── PlanCard ─────────────────────────────────────────────────────────────
function PlanCard({ plan, i, isVisible }: { plan: Plan; i: number; isVisible: boolean }) {
  const router = useRouter();
  const ANNUAL_MONTHS = 12;
  const fullSubtotal = plan.monthlyCOP * ANNUAL_MONTHS;
  const discountPct = plan.annualDiscountPercent ?? 0;
  const discountAmount = Math.round(fullSubtotal * (discountPct / 100));
  const total = fullSubtotal - discountAmount;

  return (
    <div className={`fade-up ${isVisible ? "visible" : ""} h-100`} style={{ transitionDelay: `${i * 0.1}s` }}>
      <div style={{
        background: plan.highlight ? "#1800ad" : "var(--clr-bg-surface)",
        color: plan.highlight ? "#fff" : "var(--clr-text)",
        border: plan.highlight ? "2px solid #1800ad" : "1px solid var(--clr-border)",
        borderRadius: "28px", padding: "36px 30px", position: "relative", overflow: "hidden",
        transform: plan.highlight ? "scale(1.02)" : "scale(1)",
        boxShadow: plan.highlight ? "0 30px 70px rgba(24,0,173,0.22)" : "var(--shadow-sm)",
        height: "100%",
        width: "100%",
        zIndex: plan.highlight ? 2 : 1,
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
              <span style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1 }}>
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
                Anual: ${total.toLocaleString("es-CO")} COP ({discountPct}% OFF)
              </div>
            )}
          </>
        )}

        <button
          onClick={() => router.push(getPlanRoute(plan))}
          style={{
            width: "100%", padding: "13px", borderRadius: "14px", fontWeight: 800, fontSize: "0.95rem",
            cursor: "pointer", marginBottom: "24px", border: "none",
            background: plan.highlight ? "#fff" : "#1800ad", color: plan.highlight ? "#1800ad" : "#fff",
            transition: "all 0.2s ease",
          }}
        >
          {plan.isContact ? "Contactar ventas" : plan.planCategory === 'corporativo' ? "Contratar ahora" : plan.planCategory === 'sst-con' ? "Contratar ahora" : plan.isOneTime ? "Comprar créditos" : "Comenzar ahora"}
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

// ── Página completa ───────────────────────────────────────────────────────
export default function PlanesPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [tab, setTab] = useState<TabId>("corporativo");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  // null = loading (use static fallback); PricingDoc[] = live Firestore data
  const [fsPlans, setFsPlans] = useState<PricingDoc[] | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    // Subscribe to active pricing plans in realtime
    const unsub = PricingPlanService.subscribe(
      docs => setFsPlans(docs.filter(d => d.active)),
      () => setFsPlans(null), // on error, fall back to static data
    );
    return () => unsub();
  }, []);

  const activeTab = TABS.find(t => t.id === tab)!;

  // While Firestore loads (fsPlans === null), use static data as fallback so the page isn't empty
  const activeCorp = fsPlans ? (fsPlans.filter(p => p.category === 'corporativo') as unknown as Plan[]) : corporatePlans;
  const activeSstCon = fsPlans ? (fsPlans.filter(p => p.category === 'sst-con') as unknown as Plan[]) : sstConLicenciaPlans;
  const activeSstSin = fsPlans ? (fsPlans.filter(p => p.category === 'sst-sin') as unknown as Plan[]) : sstSinLicenciaPlans;
  const activeManikins = fsPlans ? (fsPlans.filter(p => p.category === 'manikin') as unknown as ManiquiPackage[]) : maniquiPackages;

  const tabPlans: Record<TabId, Plan[]> = {
    corporativo: activeCorp,
    "sst-con": activeSstCon,
    "sst-sin": activeSstSin,
    maniquies: [],
  };

  return (
    <div ref={ref} style={{ background: "var(--clr-bg)" }}>
      <Navbar forceScrolled={true} />

      {/* Hero */}
      <section style={{
        background: "var(--clr-bg-hero)", padding: "100px 0 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(109,74,255,0.25) 0%, transparent 50%)", pointerEvents: "none" }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center">
            <span className="badge-pill-white mb-4 d-inline-flex">
              <i className="bi bi-cpu-fill" style={{ fontSize: "0.8rem" }} /> SIERCP Platform
            </span>
            <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 900, color: "#fff", lineHeight: 1.08, marginBottom: "20px" }}>
              Planes para cada <span style={{ color: "#a5f3fc" }}>necesidad</span>
            </h1>
            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: "580px", margin: "0 auto 24px" }}>
              Hardware IoT, suscripciones corporativas y planes profesionales SST en una sola plataforma.
            </p>
          </div>
        </Container>
      </section>

      {/* Tab selector */}
      <section style={{ background: "var(--clr-bg)", padding: "48px 0 0" }}>
        <Container>
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
                  padding: "11px 22px", borderRadius: "14px", border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: "0.9rem", transition: "all 0.25s ease",
                  background: tab === t.id ? "#1800ad" : "transparent",
                  color: tab === t.id ? "#fff" : "var(--clr-text)",
                  display: "flex", alignItems: "center", gap: "8px",
                }}
              >
                <i className={`bi ${t.icon}`} style={{ fontSize: "0.95rem" }} />
                {t.label}
              </button>
            ))}
          </div>
          <p style={{ textAlign: "center", marginBottom: "0", fontSize: "0.85rem", color: "var(--clr-muted)" }}>
            {activeTab.subtitle}
          </p>
        </Container>
      </section>

      {/* Cards */}
      <section style={{ background: "var(--clr-bg)", padding: "48px 0 60px" }}>
        <Container>
          <Row className="g-4 justify-content-center">
            {tab === "maniquies"
              ? activeManikins.map((pkg, i) => (
                <Col key={pkg.name} md={6} lg={3}>
                  <ManiquiCard pkg={pkg} i={i} isVisible={isVisible} />
                </Col>
              ))
              : tabPlans[tab].map((plan, i) => (
                <Col key={plan.name} md={6} lg={4}>
                  <PlanCard plan={plan} i={i} isVisible={isVisible} />
                </Col>
              ))
            }
          </Row>

          {tab === "maniquies" && (
            <div className="text-center mt-4">
              <p style={{ fontSize: "0.88rem", color: "var(--clr-muted)" }}>
                <i className="bi bi-info-circle me-1" />
                Precio único de compra. Los planes de software se contratan por separado o como paquete corporativo.{" "}
                <a href="/contacto" style={{ color: "#1800ad", fontWeight: 700 }}>Solicitar cotización integral →</a>
              </p>
            </div>
          )}

          {tab === "sst-sin" && (
            <div className="text-center mt-4">
              <p style={{ fontSize: "0.88rem", color: "var(--clr-muted)" }}>
                <i className="bi bi-shield-check me-1" />
                Todos los certificados requieren validación de identidad previa.{" "}
                Los créditos no vencen y pueden usarse cuando los necesites.
              </p>
            </div>
          )}

          <div className="text-center mt-4">
            <p style={{ fontSize: "0.9rem", color: "var(--clr-muted)" }}>
              <i className="bi bi-info-circle me-1" />
              ¿Necesidades especiales?{" "}
              <a href="/contacto" style={{ color: "#1800ad", fontWeight: 700 }}>Solicita una cotización personalizada.</a>
              {" "}Descuentos para entidades educativas públicas y ONGs.
            </p>
          </div>
        </Container>
      </section>

      {/* Tabla comparativa — solo corporativo */}
      {tab === "corporativo" && (
        <section className="section-py" style={{ background: "var(--clr-bg-light)" }}>
          <Container>
            <div className="text-center mb-5">
              <span className="badge-pill mb-3">Detalle completo</span>
              <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                Comparativa de <span style={{ color: "var(--clr-primary)" }}>planes corporativos</span>
              </h2>
            </div>
            <div style={{
              background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)",
              borderRadius: "24px", overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", background: "#1800ad", padding: "18px 24px" }}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Característica</div>
                {["PYME", "Business", "Corporate", "Enterprise"].map(p => (
                  <div key={p} style={{ color: "#fff", fontSize: "0.88rem", fontWeight: 900, textAlign: "center" }}>{p}</div>
                ))}
              </div>
              {comparisons.map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "14px 24px",
                  borderBottom: i < comparisons.length - 1 ? "1px solid var(--clr-border)" : "none",
                  background: i % 2 === 0 ? "transparent" : "var(--clr-bg)",
                }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--clr-text)", fontWeight: 600 }}>{row.feature}</div>
                  {[row.pyme, row.business, row.corporate, row.enterprise].map((val, j) => (
                    <div key={j} style={{
                      textAlign: "center", fontSize: "0.85rem",
                      color: val === "—" ? "var(--clr-border)" : j === 1 ? "#1800ad" : "var(--clr-text)",
                      fontWeight: j === 1 ? 800 : 600,
                    }}>
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Testimonios */}
      <section className="section-py" style={{ background: "var(--clr-bg)" }}>
        <Container>
          <div className="text-center mb-5">
            <span className="badge-pill mb-3">Casos de éxito</span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
              Lo que dicen nuestros <span style={{ color: "var(--clr-primary)" }}>clientes</span>
            </h2>
          </div>
          <Row className="g-4 justify-content-center">
            {testimonials.map((t, i) => (
              <Col key={i} md={4}>
                <div style={{
                  background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)",
                  borderRadius: "24px", padding: "32px", height: "100%",
                }}>
                  <div className="d-flex align-items-center gap-2 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <i key={s} className="bi bi-star-fill" style={{ color: "#f59e0b", fontSize: "0.85rem" }} />
                    ))}
                    <span style={{ fontSize: "0.7rem", background: "var(--clr-primary-alpha)", color: "#1800ad", padding: "2px 10px", borderRadius: "100px", fontWeight: 800, marginLeft: "6px" }}>
                      Plan {t.plan}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.95rem", color: "var(--clr-text)", lineHeight: 1.75, fontStyle: "italic", marginBottom: "20px" }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <div style={{ fontWeight: 900, color: "var(--clr-text-head)", fontSize: "0.9rem" }}>{t.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)" }}>{t.role}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* FAQ */}
      <section className="section-py" style={{ background: "var(--clr-bg-light)" }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="text-center mb-5">
                <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
                  Preguntas sobre <span style={{ color: "var(--clr-primary)" }}>precios</span>
                </h2>
              </div>
              <div className="d-flex flex-column gap-3">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--clr-bg-surface)",
                      border: `1px solid ${openFaq === i ? "#1800ad" : "var(--clr-border)"}`,
                      borderRadius: "18px", overflow: "hidden", cursor: "pointer",
                    }}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="d-flex justify-content-between align-items-center p-4">
                      <h6 style={{ margin: 0, fontWeight: 800, fontSize: "0.97rem", color: "var(--clr-text-head)" }}>{faq.q}</h6>
                      <i className={`bi bi-chevron-${openFaq === i ? "up" : "down"}`} style={{ color: "#1800ad", flexShrink: 0, marginLeft: "16px" }} />
                    </div>
                    {openFaq === i && (
                      <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--clr-border)", paddingTop: "16px" }}>
                        <p style={{ margin: 0, color: "var(--clr-text)", lineHeight: 1.75, fontSize: "0.92rem" }}>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA final */}
      <section style={{ background: "var(--clr-primary)", padding: "80px 0" }}>
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={7}>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fff", margin: 0 }}>
                ¿Listo para digitalizar tu formación en RCP?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", margin: "14px 0 0", lineHeight: 1.65 }}>
                Agenda una demo gratuita de 45 minutos y ve el sistema funcionando en tiempo real.
              </p>
            </Col>
            <Col lg={5} className="text-lg-end">
              <div className="d-flex gap-3 flex-wrap justify-content-lg-end">
                <a href="/contacto" className="btn-brand-on-dark" style={{ padding: "14px 28px", borderRadius: "14px", fontSize: "0.95rem" }}>
                  <i className="bi bi-play-circle-fill me-2" />Solicitar Demo Gratis
                </a>
                <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="btn-outline-on-dark" style={{ padding: "14px 28px", borderRadius: "14px", fontSize: "0.95rem" }}>
                  <i className="bi bi-whatsapp me-2" />Hablar por WhatsApp
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Footer />
      <WhatsAppFab />
    </div>
  );
}
