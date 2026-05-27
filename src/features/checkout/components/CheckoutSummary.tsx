'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CreditCard, Lock, BadgeCheck, Tag, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { formatCOP } from '../schemas/shared.schema';
import type { ProductSummary } from '../config/checkout.config';

export interface DiscountResult {
  code: string;
  discountCents: number;
  label: string;
}

interface CheckoutSummaryProps {
  product: ProductSummary;
  discount: DiscountResult | null;
  onApplyDiscount?: (code: string) => Promise<DiscountResult | null>;
  onRemoveDiscount?: () => void;
  extraLines?: Array<{ label: string; valueCOP: number; highlight?: boolean }>;
}

const PAYMENT_BADGES = [
  { Icon: ShieldCheck, label: 'SSL 256-bit' },
  { Icon: CreditCard, label: 'PCI-DSS L1' },
  { Icon: Lock, label: 'Datos protegidos' },
  { Icon: BadgeCheck, label: 'Wompi' },
];

export function CheckoutSummary({
  product,
  discount,
  onApplyDiscount,
  onRemoveDiscount,
  extraLines = [],
}: CheckoutSummaryProps) {
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  // Mobile: colapsado por defecto; desktop: siempre abierto (botón oculto con lg:hidden)
  const [mobileOpen, setMobileOpen] = useState(false);

  const discountAmount = discount ? discount.discountCents / 100 : 0;
  const extrasTotal = extraLines.reduce((s, l) => s + l.valueCOP, 0);
  const total = Math.max(0, product.priceCOP - discountAmount + extrasTotal);

  async function handleApplyCoupon() {
    if (!couponInput.trim() || !onApplyDiscount) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const result = await onApplyDiscount(couponInput.trim().toUpperCase());
      if (!result) setCouponError('Código inválido o expirado');
      else setCouponInput('');
    } catch {
      setCouponError('Error al validar el código');
    } finally {
      setCouponLoading(false);
    }
  }

  return (
    <div className="sticky top-28">
      {/* Botón de colapso — solo en mobile */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="lg:hidden w-full flex items-center justify-between px-5 py-3.5 rounded-2xl mb-2"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--clr-border)',
        }}
      >
        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
          {product.title}
        </span>
        <div className="flex items-center gap-2">
          <motion.span
            key={total}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="font-black text-lg"
            style={{ color: 'var(--clr-primary)' }}
          >
            {formatCOP(total)}
          </motion.span>
          <ChevronDown
            size={16}
            style={{
              color: 'var(--clr-muted)',
              transform: mobileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </button>

      {/*
        Panel de resumen.
        - Mobile: visible solo cuando mobileOpen = true
        - Desktop (lg+): siempre visible gracias a lg:block
        AnimatePresence solo controla la animación en mobile.
      */}
      <div className="hidden lg:block">
        <SummaryPanel
          product={product}
          discount={discount}
          discountAmount={discountAmount}
          extraLines={extraLines}
          total={total}
          couponInput={couponInput}
          setCouponInput={setCouponInput}
          couponLoading={couponLoading}
          couponError={couponError}
          setCouponError={setCouponError}
          onApplyDiscount={onApplyDiscount}
          onRemoveDiscount={onRemoveDiscount}
          handleApplyCoupon={handleApplyCoupon}
        />
      </div>

      <div className="lg:hidden">
        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              key="mobile-summary"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <SummaryPanel
                product={product}
                discount={discount}
                discountAmount={discountAmount}
                extraLines={extraLines}
                total={total}
                couponInput={couponInput}
                setCouponInput={setCouponInput}
                couponLoading={couponLoading}
                couponError={couponError}
                setCouponError={setCouponError}
                onApplyDiscount={onApplyDiscount}
                onRemoveDiscount={onRemoveDiscount}
                handleApplyCoupon={handleApplyCoupon}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Panel de contenido (compartido entre desktop y mobile) ─────────────────────

interface SummaryPanelProps {
  product: ProductSummary;
  discount: DiscountResult | null;
  discountAmount: number;
  extraLines: Array<{ label: string; valueCOP: number; highlight?: boolean }>;
  total: number;
  couponInput: string;
  setCouponInput: (v: string) => void;
  couponLoading: boolean;
  couponError: string;
  setCouponError: (v: string) => void;
  onApplyDiscount?: (code: string) => Promise<DiscountResult | null>;
  onRemoveDiscount?: () => void;
  handleApplyCoupon: () => void;
}

function SummaryPanel({
  product, discount, discountAmount, extraLines, total,
  couponInput, setCouponInput, couponLoading, couponError, setCouponError,
  onApplyDiscount, onRemoveDiscount, handleApplyCoupon,
}: SummaryPanelProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--bg-surface)',
        border: '1.5px solid var(--clr-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Card del producto */}
      <div
        className="rounded-xl p-4 mb-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))' }}
      >
        <div
          className="absolute -top-5 -right-5 w-20 h-20 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
        <div className="relative">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
          >
            <BadgeCheck size={11} />
            {product.subtitle ?? 'Certificado SIERCP'}
          </div>
          <div className="font-black text-[15px] text-white leading-snug mb-1">
            {product.title}
          </div>
          {product.features && (
            <ul className="space-y-0.5">
              {product.features.map((f) => (
                <li key={f} className="text-[12px] text-white/80 flex items-center gap-1.5">
                  <span className="text-white font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Desglose de precios */}
      <div className="space-y-2.5 mb-4">
        {product.originalPriceCOP && (
          <PriceRow label="Precio original" value={formatCOP(product.originalPriceCOP)} strikethrough />
        )}
        <PriceRow label="Precio" value={formatCOP(product.priceCOP)} />
        {extraLines.map((line) => (
          <PriceRow
            key={line.label}
            label={line.label}
            value={line.valueCOP === 0 ? 'Gratis' : formatCOP(line.valueCOP)}
            highlight={line.highlight}
          />
        ))}
        {discountAmount > 0 && (
          <PriceRow
            label={`Descuento (${discount?.code})`}
            value={`− ${formatCOP(discountAmount)}`}
            highlight
          />
        )}
        <PriceRow label="IVA" value="Incluido" />
      </div>

      {/* Cupón */}
      {onApplyDiscount && (
        <div className="mb-4 pt-3" style={{ borderTop: '1px solid var(--clr-border)' }}>
          {discount ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-3 py-2 rounded-lg gap-2"
              style={{ background: 'var(--success-bg)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Tag size={13} style={{ color: 'var(--clr-success)', flexShrink: 0 }} />
                <span className="text-xs font-bold truncate" style={{ color: 'var(--success-text)' }}>
                  {discount.code}
                </span>
              </div>
              <span className="text-xs font-black shrink-0" style={{ color: 'var(--clr-success)' }}>
                −{formatCOP(discountAmount)}
              </span>
              {onRemoveDiscount && (
                <button
                  type="button"
                  onClick={onRemoveDiscount}
                  className="text-xs ml-1 shrink-0 hover:underline"
                  style={{ color: 'var(--success-text)' }}
                >
                  ×
                </button>
              )}
            </motion.div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="Código de descuento"
                  maxLength={30}
                  className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: `1.5px solid ${couponError ? 'var(--color-error)' : 'var(--clr-border)'}`,
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 shrink-0"
                  style={{ background: 'var(--clr-primary)', color: '#fff' }}
                >
                  {couponLoading ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponError && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--color-error)' }}>
                  {couponError}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Total */}
      <div
        className="pt-4 mt-1 flex justify-between items-baseline"
        style={{ borderTop: '2px dashed var(--clr-border)' }}
      >
        <span className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>
          Total a pagar
        </span>
        <motion.span
          key={total}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="font-black text-3xl tracking-tight"
          style={{ color: 'var(--clr-primary)' }}
        >
          {formatCOP(total)}
        </motion.span>
      </div>

      {/* Trust badges */}
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--clr-border)' }}>
        <p className="text-center text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--clr-muted)' }}>
          Pago 100% seguro
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PAYMENT_BADGES.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
              style={{
                background: 'var(--bg-surface-2, var(--clr-bg-light))',
                border: '1px solid var(--clr-border)',
              }}
            >
              <Icon size={12} style={{ color: 'var(--clr-primary)', flexShrink: 0 }} />
              <span className="text-[10px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center mt-2.5 text-[11px]" style={{ color: 'var(--clr-muted)' }}>
          Procesado por <strong>Wompi</strong> · Colombia
        </p>
      </div>
    </div>
  );
}

function PriceRow({
  label, value, highlight, strikethrough,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  strikethrough?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span style={{ color: 'var(--clr-muted)', fontWeight: 600 }}>{label}</span>
      <span
        className={strikethrough ? 'line-through' : ''}
        style={{
          fontWeight: highlight ? 800 : 700,
          color: highlight
            ? 'var(--clr-success)'
            : strikethrough
            ? 'var(--clr-muted)'
            : 'var(--text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
