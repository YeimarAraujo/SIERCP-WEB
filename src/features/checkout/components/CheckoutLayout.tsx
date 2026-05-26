'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CheckoutStepper } from './CheckoutStepper';

interface CheckoutLayoutProps {
  /** Título principal de la página de checkout */
  title: string;
  subtitle?: string;
  /** Pasos del flujo (para el stepper visual) */
  steps: Array<{ id: string; title: string }>;
  /** Índice del paso actual (0-based) */
  currentStepIndex: number;
  /** Formulario/contenido del paso actual */
  children: ReactNode;
  /** Panel lateral derecho (CheckoutSummary) */
  summary: ReactNode;
  /** URL a la que va el botón "Salir" — por defecto '/' */
  exitHref?: string;
}

export function CheckoutLayout({
  title,
  subtitle,
  steps,
  currentStepIndex,
  children,
  summary,
  exitHref = '/',
}: CheckoutLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page, var(--clr-bg-light))' }}>
      {/* Barra superior */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 sm:px-8 py-4"
        style={{
          background: 'var(--bg-surface, var(--clr-bg))',
          borderBottom: '1px solid var(--clr-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
            style={{ background: 'var(--clr-primary)' }}
          >
            S
          </div>
          <span className="font-black text-base hidden sm:block" style={{ color: 'var(--text-primary)' }}>
            SIERCP
          </span>
        </Link>

        {/* Stepper — centrado, oculto en mobile muy pequeño */}
        <div className="hidden md:block flex-1 px-8">
          <CheckoutStepper steps={steps} currentIndex={currentStepIndex} />
        </div>

        <Link
          href={exitHref}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors shrink-0"
          style={{
            color: 'var(--clr-muted)',
            border: '1.5px solid var(--clr-border)',
          }}
        >
          <X size={13} />
          <span className="hidden sm:inline">Salir</span>
        </Link>
      </header>

      {/* Stepper mobile (fuera del header para evitar overflow) */}
      <div className="md:hidden px-4 pt-5 pb-2">
        <CheckoutStepper steps={steps} currentIndex={currentStepIndex} />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 pt-8">
        {/* Encabezado de sección */}
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest mb-3"
            style={{
              background: 'color-mix(in srgb, var(--clr-primary) 10%, transparent)',
              color: 'var(--clr-primary)',
            }}
          >
            Pago 100% seguro
          </div>
          <h1
            className="font-black text-3xl sm:text-4xl tracking-tight mb-2"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--clr-muted)', lineHeight: 1.65 }}>
              {subtitle}
            </p>
          )}
        </motion.div>

        {/*
          Layout 2 columnas:
          - Mobile/tablet: columna única (summary arriba como acordeón, form abajo)
          - Desktop (lg+): form 60% | summary 40%
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* Summary — solo en mobile/tablet (arriba del form) */}
          <div className="lg:hidden w-full order-first">
            {summary}
          </div>

          {/* Formulario */}
          <div
            className="w-full rounded-2xl p-6 sm:p-8"
            style={{
              background: 'var(--bg-surface, var(--clr-bg))',
              border: '1px solid var(--clr-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {children}
          </div>

          {/* Summary — solo en desktop (columna derecha) */}
          <div className="hidden lg:block w-full">
            {summary}
          </div>
        </div>
      </main>
    </div>
  );
}
