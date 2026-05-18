'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DEFAULT_PLANS, type PlanLimits } from '@/shared/types/plan';
import {
  Crown, Zap, Rocket, Users, BookOpen, Cpu, Shield,
  CheckCircle2, X, Star, CreditCard, Palette, Globe2,
  Headphones, BarChart3, Mail, Video, Code2, FileDown,
  Tag, Percent, Clock, Award, Bell, Lock
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Feature category definitions ─────────────────────────────────────────────

interface FeatureRow {
  label: string;
  icon: LucideIcon;
  getValue: (l: PlanLimits) => string | boolean | number;
  formatValue?: (v: any) => string;
}

interface FeatureCategory {
  title: string;
  icon: LucideIcon;
  color: string;
  features: FeatureRow[];
}

const fmt = (v: number) => v === -1 ? 'Ilimitado' : v.toLocaleString('es-CO');
const fmtMB = (v: number) => v === -1 ? 'Ilimitado' : v >= 1000 ? `${(v / 1000).toFixed(0)} GB` : `${v} MB`;
const fmtDays = (v: number) => v === -1 ? 'Ilimitado' : v >= 365 ? `${Math.round(v / 365)} año(s)` : `${v} días`;

const CATEGORIES: FeatureCategory[] = [
  {
    title: 'Usuarios y Roles', icon: Users, color: '#3B82F6',
    features: [
      { label: 'Estudiantes', icon: Users, getValue: l => l.maxStudents, formatValue: fmt },
      { label: 'Instructores', icon: Users, getValue: l => l.maxInstructors, formatValue: fmt },
      { label: 'Administradores', icon: Shield, getValue: l => l.maxAdmins, formatValue: fmt },
      { label: 'Usuarios concurrentes', icon: Zap, getValue: l => l.maxConcurrentUsers, formatValue: fmt },
    ],
  },
  {
    title: 'Contenido Académico', icon: BookOpen, color: '#8B5CF6',
    features: [
      { label: 'Cursos / Plantillas', icon: BookOpen, getValue: l => l.maxCourses, formatValue: fmt },
      { label: 'Cohortes activas', icon: Users, getValue: l => l.maxActiveCohorts, formatValue: fmt },
      { label: 'Módulos por curso', icon: BookOpen, getValue: l => l.maxModulesPerCourse, formatValue: fmt },
      { label: 'Almacenamiento', icon: Globe2, getValue: l => l.storageLimitMB, formatValue: fmtMB },
      { label: 'Peso máx. por archivo', icon: FileDown, getValue: l => l.maxFileSizeMB, formatValue: fmtMB },
    ],
  },
  {
    title: 'Hardware SIERCP', icon: Cpu, color: '#10B981',
    features: [
      { label: 'Dispositivos (maniquíes)', icon: Cpu, getValue: l => l.maxDevices, formatValue: fmt },
      { label: 'Retención de sesiones', icon: Clock, getValue: l => l.sessionRetentionDays, formatValue: fmtDays },
      { label: 'Métricas avanzadas', icon: BarChart3, getValue: l => l.hasAdvancedMetrics },
    ],
  },
  {
    title: 'Automatización', icon: Zap, color: '#F59E0B',
    features: [
      { label: 'Cohortes automáticas', icon: Zap, getValue: l => l.hasAutomatedCohorts },
      { label: 'Certificados automáticos', icon: Award, getValue: l => l.hasAutoCertificates },
      { label: 'Certificados personalizados', icon: Award, getValue: l => l.hasCustomCertificates },
      { label: 'Recordatorios automáticos', icon: Bell, getValue: l => l.hasAutoReminders },
    ],
  },
  {
    title: 'Monetización', icon: CreditCard, color: '#EC4899',
    features: [
      { label: 'Comisión plataforma', icon: Percent, getValue: l => l.transactionFeePercent, formatValue: (v: number) => v === 0 ? '0% 🎉' : `${v}%` },
      { label: 'Pasarela de pagos propia', icon: CreditCard, getValue: l => l.hasOwnPaymentGateway },
      { label: 'Códigos de descuento', icon: Tag, getValue: l => l.hasDiscountCodes },
    ],
  },
  {
    title: 'Marca y White-label', icon: Palette, color: '#6366F1',
    features: [
      { label: 'Marca blanca', icon: Lock, getValue: l => l.hasWhiteLabel },
      { label: 'Tema personalizado', icon: Palette, getValue: l => l.hasCustomTheme },
      { label: 'Dominio propio', icon: Globe2, getValue: l => l.hasCustomDomain },
      { label: 'Dominio de correo propio', icon: Mail, getValue: l => l.hasCustomEmailDomain },
    ],
  },
  {
    title: 'Integraciones', icon: Code2, color: '#14B8A6',
    features: [
      { label: 'Zoom / Meet / Teams', icon: Video, getValue: l => l.hasVideoIntegration },
      { label: 'API & Webhooks', icon: Code2, getValue: l => l.hasAPIAccess },
      { label: 'Exportación de datos', icon: FileDown, getValue: l => l.hasDataExport },
    ],
  },
  {
    title: 'Soporte', icon: Headphones, color: '#EF4444',
    features: [
      { label: 'Nivel de soporte', icon: Headphones, getValue: l => l.supportLevel, formatValue: (v: string) => {
        const map: Record<string, string> = { community: 'Comunidad', email: 'Email', priority: 'Prioritario', dedicated: 'Dedicado 24/7' };
        return map[v] || v;
      }},
      { label: 'SLA (respuesta)', icon: Clock, getValue: l => l.slaResponseHours, formatValue: (v: number) => v === -1 ? 'Sin SLA' : `${v}h` },
    ],
  },
];

const PLAN_ICONS = [Crown, Rocket, Star];
const PLAN_COLORS = ['#64748B', '#1800AD', '#F59E0B'];
const PLAN_BG = ['#F8FAFC', '#F5F3FF', '#FFFBEB'];

export default function SuperAdminPlansPage() {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const toggleCat = (title: string) => {
    setExpandedCat(expandedCat === title ? null : title);
  };

  const renderValue = (val: string | boolean | number, feature: FeatureRow) => {
    if (typeof val === 'boolean') {
      return val
        ? <CheckCircle2 size={18} style={{ color: '#10B981' }} />
        : <X size={18} style={{ color: '#CBD5E1' }} />;
    }
    if (feature.formatValue) return feature.formatValue(val);
    return String(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
      <Header title="Planes y Licencias" />

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <PageHero
          title="Planes y Licencias"
          subtitle="Configura los límites y características de cada nivel de suscripción"
          parentTitle="Super Admin"
          parentHref="/super-admin/dashboard"
        />

        {/* ─── Plan cards ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          {DEFAULT_PLANS.map((plan, idx) => {
            const Icon = PLAN_ICONS[idx];
            const color = PLAN_COLORS[idx];
            const bg = PLAN_BG[idx];
            return (
              <div key={plan.slug} style={{
                background: '#FFFFFF', borderRadius: 24, border: plan.isRecommended ? `2px solid ${color}` : '1px solid #E2E8F0',
                padding: 28, position: 'relative', overflow: 'hidden',
                boxShadow: plan.isRecommended ? `0 8px 24px -8px ${color}30` : '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                {plan.isRecommended && (
                  <div style={{
                    position: 'absolute', top: 14, right: -30, background: color,
                    color: '#FFFFFF', fontSize: 9, fontWeight: 900, padding: '3px 40px',
                    transform: 'rotate(45deg)', letterSpacing: '0.05em',
                  }}>RECOMENDADO</div>
                )}
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18, color,
                }}><Icon size={26} /></div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 16px', lineHeight: 1.5 }}>{plan.description}</p>

                <div style={{ marginBottom: 20 }}>
                  {plan.priceCOP === -1 ? (
                    <span style={{ fontSize: 26, fontWeight: 900, color }}>Contactar</span>
                  ) : plan.priceCOP === 0 ? (
                    <span style={{ fontSize: 26, fontWeight: 900, color }}>Gratis</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 26, fontWeight: 900, color }}>${(plan.priceCOP / 1000).toFixed(0)}K</span>
                      <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}> COP/mes</span>
                    </>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Estudiantes', val: fmt(plan.limits.maxStudents) },
                    { label: 'Cursos', val: fmt(plan.limits.maxCourses) },
                    { label: 'Dispositivos', val: fmt(plan.limits.maxDevices) },
                    { label: 'Comisión', val: plan.limits.transactionFeePercent === 0 ? '0%' : `${plan.limits.transactionFeePercent}%` },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: bg, borderRadius: 10, padding: '8px 12px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{s.val}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Feature comparison table ───────────────────────── */}
        <div style={{
          background: '#FFFFFF', borderRadius: 24, border: '1px solid #E2E8F0',
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Comparación de Características</h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>Click en cada categoría para expandir los detalles</p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '280px repeat(3, 1fr)',
            borderBottom: '2px solid #E2E8F0', position: 'sticky', top: 0,
            background: '#FFFFFF', zIndex: 10,
          }}>
            <div style={{ padding: '14px 24px', fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>CARACTERÍSTICA</div>
            {DEFAULT_PLANS.map((plan, idx) => (
              <div key={plan.slug} style={{
                padding: '14px 20px', textAlign: 'center', fontSize: 13,
                fontWeight: 800, color: PLAN_COLORS[idx],
                background: plan.isRecommended ? '#FAFAFF' : 'transparent',
              }}>{plan.name}</div>
            ))}
          </div>

          {CATEGORIES.map(cat => {
            const expanded = expandedCat === cat.title || expandedCat === null;
            const CatIcon = cat.icon;
            return (
              <div key={cat.title}>
                <div
                  onClick={() => toggleCat(cat.title)}
                  style={{
                    display: 'grid', gridTemplateColumns: '280px repeat(3, 1fr)',
                    borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                    background: '#FAFBFC',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FAFBFC'; }}
                >
                  <div style={{
                    padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 13, fontWeight: 800, color: cat.color,
                  }}>
                    <CatIcon size={16} />
                    {cat.title}
                    <span style={{
                      fontSize: 10, color: '#CBD5E1', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}>▶</span>
                  </div>
                  <div /><div /><div />
                </div>

                {expanded && cat.features.map(feat => (
                  <div key={feat.label} style={{
                    display: 'grid', gridTemplateColumns: '280px repeat(3, 1fr)',
                    borderBottom: '1px solid #F8FAFC',
                  }}>
                    <div style={{
                      padding: '10px 24px 10px 44px', fontSize: 12, fontWeight: 600,
                      color: '#475569', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <feat.icon size={13} style={{ color: '#94A3B8' }} />
                      {feat.label}
                    </div>
                    {DEFAULT_PLANS.map((plan) => {
                      const val = feat.getValue(plan.limits);
                      return (
                        <div key={plan.slug} style={{
                          padding: '10px 20px', textAlign: 'center', fontSize: 13,
                          fontWeight: 700, color: '#0F172A',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: plan.isRecommended ? '#FAFAFF' : 'transparent',
                        }}>
                          {renderValue(val, feat)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
