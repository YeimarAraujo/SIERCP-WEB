'use client';

/**
 * PaymentMethods — selector de pago unificado para todos los productos.
 *
 * Soporta Tarjeta (inline, sin redirección) y PSE (redirige al banco,
 * comportamiento obligatorio del protocolo PSE). Nequi y Bancolombia
 * se añadirán en fases futuras.
 *
 * Uso:
 *   <PaymentMethods
 *     amountCOP={precio}
 *     productId="curso-rcp-basico"
 *     productTitle="Curso RCP Básico"
 *     onStatusChange={handleStatus}
 *     onApproved={handleEnrollment}
 *   />
 */

import { useState } from 'react';
import { CreditCard, Building2 } from 'lucide-react';
import CardForm, { type CardFormData } from '@/components/CardForm';
import PSEForm, { type PSEFormData } from '@/components/PSEForm';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import type { PaymentStatus } from '../CheckoutPage';

type Method = 'CARD' | 'PSE';

interface PaymentMethodsProps {
  amountCOP: number;
  /** ID único del producto (cursoSlug, planId, packId, etc.) */
  productId: string;
  productTitle: string;
  customerEmail?: string;
  onStatusChange: (status: PaymentStatus, error?: string) => void;
  /** Llamado cuando el pago con tarjeta es APROBADO — enrollment/fulfillment */
  onApproved?: (transactionId: string, method: string) => Promise<void>;
}

export function PaymentMethods({
  amountCOP,
  productId,
  productTitle,
  customerEmail,
  onStatusChange,
  onApproved,
}: PaymentMethodsProps) {
  const [method, setMethod] = useState<Method>('CARD');
  const [cardData, setCardData] = useState<Partial<CardFormData>>({});
  const [cardValid, setCardValid] = useState(false);
  const [pseData, setPseData] = useState<Partial<PSEFormData>>({});
  const [pseValid, setPseValid] = useState(false);

  const {
    step,
    termsAccepted,
    setTermsAccepted,
    acceptancePermalink,
    payWithCard,
    payWithPSE,
    isLoading,
  } = usePaymentFlow({ amountCOP, productId, onApproved, onStatusChange });

  const canPay = method === 'CARD'
    ? cardValid && termsAccepted
    : pseValid && termsAccepted;

  async function handlePay() {
    if (!canPay || isLoading) return;
    if (method === 'CARD') await payWithCard(cardData as CardFormData);
    else await payWithPSE(pseData as PSEFormData);
  }

  return (
    <div className="space-y-5">
      {/* ── Selector de método ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { id: 'CARD', label: 'Tarjeta', icon: <CreditCard size={15} /> },
          { id: 'PSE', label: 'PSE / Banco', icon: <Building2 size={15} /> },
        ] as { id: Method; label: string; icon: React.ReactNode }[]).map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all"
            style={{
              border: `2px solid ${method === id ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: method === id
                ? 'color-mix(in srgb, var(--clr-primary) 8%, transparent)'
                : 'var(--bg-surface-2, var(--clr-bg-light))',
              color: method === id ? 'var(--clr-primary)' : 'var(--clr-muted)',
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── Formulario de pago ──────────────────────────────────────── */}
      {method === 'CARD' ? (
        <CardForm
          totalCOP={amountCOP}
          onChange={(data, valid) => { setCardData(data); setCardValid(valid); }}
        />
      ) : (
        <PSEForm
          customerEmail={customerEmail ?? ''}
          cursoNombre={productTitle}
          onChange={(data, valid) => { setPseData(data); setPseValid(valid); }}
        />
      )}

      {/* ── Términos de Wompi ───────────────────────────────────────── */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'var(--bg-surface-2, var(--clr-bg-light))' }}
      >
        <input
          type="checkbox"
          id="wompi-terms"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer"
          style={{ accentColor: 'var(--clr-primary)' }}
        />
        <label
          htmlFor="wompi-terms"
          className="text-xs leading-relaxed cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          Acepto los{' '}
          <a
            href={acceptancePermalink ?? 'https://wompi.com/es/terminos-y-condiciones/'}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline"
            style={{ color: 'var(--clr-primary)' }}
          >
            términos de Wompi
          </a>{' '}
          y la política de tratamiento de datos de SIERCP (Ley 1581 de 2012).
        </label>
      </div>

      {/* ── Botón de pago ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!canPay || isLoading}
        className="w-full py-4 rounded-xl font-black text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: canPay && !isLoading
            ? 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))'
            : 'var(--clr-muted)',
          boxShadow: canPay && !isLoading
            ? '0 8px 24px color-mix(in srgb, var(--clr-primary) 28%, transparent)'
            : 'none',
        }}
      >
        {isLoading
          ? step === 'tokenizing'   ? 'Verificando tarjeta…'
          : step === 'processing'   ? 'Procesando pago…'
          : step === 'verifying'    ? 'Confirmando con el banco…'
          : step === 'redirecting'  ? 'Redirigiendo al banco…'
          : 'Procesando…'
          : method === 'PSE'
            ? 'Continuar al banco'
            : 'Pagar de forma segura'
        }
      </button>

      {/* PSE info note */}
      {method === 'PSE' && (
        <p className="text-[11px] text-center" style={{ color: 'var(--clr-muted)' }}>
          Serás redirigido al portal de tu banco para completar el pago.
          Regresa a esta página una vez autorices la transacción.
        </p>
      )}
    </div>
  );
}
