'use client';

/**
 * CheckoutPage universal — orquestador único para todos los tipos de producto.
 *
 * Recibe `productKind` y `product` (resumen del producto), carga la config
 * de `checkout.config.ts` y renderiza el flujo de pasos correcto.
 *
 * Consumo:
 *   <CheckoutPage
 *     productKind="pack_manikin"
 *     product={{ kind: 'pack_manikin', productId: 'pack-4', title: 'Pack 4 maniquíes', ... }}
 *     onComplete={(data) => { ... }}
 *   />
 */

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { CheckoutLayout } from './components/CheckoutLayout';
import { CheckoutSummary, type DiscountResult } from './components/CheckoutSummary';
import { DynamicCheckoutForm } from './components/DynamicCheckoutForm';
import { AuthGate } from './components/AuthGate';
import { getCheckoutConfig, type ProductKind, type ProductSummary } from './config/checkout.config';
import { formatCOP } from './schemas/shared.schema';
import { useAuth } from '@/hooks/use-auth';

// ── Paso de pago (integra Wompi o PSE) ───────────────────────────────────────

export type PaymentStatus = 'idle' | 'pending' | 'approved' | 'declined' | 'error';

interface PaymentStep {
  status: PaymentStatus;
  errorMessage?: string;
  transactionRef?: string;
}

// ── Props del orquestador ─────────────────────────────────────────────────────

interface CheckoutPageProps {
  productKind: ProductKind;
  product: ProductSummary;
  /** Llamado con todos los datos recolectados al llegar al paso de pago */
  onComplete: (formData: Record<string, unknown>, discount: DiscountResult | null) => Promise<void>;
  /** URL para volver al landing/página del producto */
  exitHref?: string;
  isSubmitting?: boolean;
  paymentStatus?: PaymentStatus;
  paymentError?: string;
  /** Nodo personalizado para el paso de pago (CardForm + PSEForm existentes) */
  paymentSlot?: React.ReactNode;
}

export function CheckoutPage({
  productKind,
  product,
  onComplete,
  exitHref = '/',
  isSubmitting = false,
  paymentStatus = 'idle',
  paymentError,
  paymentSlot,
}: CheckoutPageProps) {
  const config = getCheckoutConfig(productKind);
  const { user } = useAuth();

  const [authCompleted, setAuthCompleted] = useState(false);
  const needsAuthGate = config.requiresAuth && !user && !authCompleted;

  // Auth step prepended when product requires authentication
  const authOffset = config.requiresAuth ? 1 : 0;
  const allStepLabels = [
    ...(config.requiresAuth ? [{ id: 'auth', title: 'Identidad' }] : []),
    ...config.steps.map((s) => ({ id: s.id, title: s.title })),
    { id: 'payment', title: 'Pago' },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, unknown>>({});
  const [discount, setDiscount] = useState<DiscountResult | null>(null);

  const isOnPaymentStep = currentStep === config.steps.length;
  const currentFormStep = isOnPaymentStep ? null : config.steps[currentStep];

  // Index passed to the stepper: auth gate is index 0 when visible, form steps shifted by authOffset
  const stepperIndex = needsAuthGate ? 0 : currentStep + authOffset;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFormSubmit = useCallback(
    async (stepData: Record<string, unknown>) => {
      const merged = { ...collectedData, ...stepData };
      setCollectedData(merged);

      if (currentStep < config.steps.length - 1) {
        // Hay más pasos de formulario
        setCurrentStep((s) => s + 1);
      } else {
        // Último paso de form → ir al paso de pago
        setCurrentStep(config.steps.length);
        await onComplete(merged, discount);
      }
    },
    [collectedData, currentStep, config.steps.length, onComplete, discount],
  );

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  // ── Render de estado de pago ─────────────────────────────────────────────────

  if (paymentStatus === 'approved') {
    return <PaymentResultScreen status="approved" product={product} exitHref={exitHref} />;
  }
  if (paymentStatus === 'declined' || paymentStatus === 'error') {
    return (
      <PaymentResultScreen
        status="declined"
        product={product}
        exitHref={exitHref}
        errorMessage={paymentError}
        onRetry={() => setCurrentStep(config.steps.length)}
      />
    );
  }

  return (
    <CheckoutLayout
      title={config.title}
      subtitle={config.subtitle}
      steps={allStepLabels}
      currentStepIndex={stepperIndex}
      exitHref={exitHref}
      summary={
        <CheckoutSummary
          product={product}
          discount={discount}
          onApplyDiscount={async (code) => {
            try {
              const res = await fetch('/api/discounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, amountCents: product.priceCOP * 100 }),
              });
              if (!res.ok) return null;
              const data = await res.json() as { discountCents: number; label: string };
              const result: DiscountResult = { code, discountCents: data.discountCents, label: data.label };
              setDiscount(result);
              return result;
            } catch {
              return null;
            }
          }}
          onRemoveDiscount={() => setDiscount(null)}
        />
      }
    >
      <AnimatePresence mode="wait">
        {/* ── Paso de autenticación ─────────────────────────────────────── */}
        {needsAuthGate && (
          <motion.div
            key="auth-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <AuthGate
              onAuthenticated={() => setAuthCompleted(true)}
              allowGuest={config.allowGuest}
              onContinueAsGuest={() => setAuthCompleted(true)}
            />
          </motion.div>
        )}

        {/* ── Pasos de formulario ────────────────────────────────────────── */}
        {!needsAuthGate && !isOnPaymentStep && currentFormStep && (
          <motion.div
            key={`form-step-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Encabezado del paso */}
            <div className="mb-6">
              <h2 className="font-black text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
                {currentFormStep.title}
              </h2>
              {currentFormStep.description && (
                <p className="text-sm" style={{ color: 'var(--clr-muted)' }}>
                  {currentFormStep.description}
                </p>
              )}
            </div>

            <DynamicCheckoutForm
              step={currentFormStep}
              defaultValues={collectedData}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
              onBack={currentStep > 0 ? handleBack : undefined}
            />
          </motion.div>
        )}

        {/* ── Paso de pago ──────────────────────────────────────────────── */}
        {!needsAuthGate && isOnPaymentStep && (
          <motion.div
            key="payment-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6">
              <h2 className="font-black text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
                Método de pago
              </h2>
              <p className="text-sm" style={{ color: 'var(--clr-muted)' }}>
                Tus datos de tarjeta se cifran directamente con Wompi · PCI-DSS Level 1
              </p>
            </div>

            {paymentStatus === 'pending' || isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--clr-primary)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--clr-muted)' }}>
                  Procesando pago de forma segura…
                </p>
                <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>
                  No cierres esta pestaña
                </p>
              </div>
            ) : (
              <>
                {paymentSlot}

                <div className="mt-4 flex">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                    style={{
                      border: '1.5px solid var(--clr-border)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    ← Volver a mis datos
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </CheckoutLayout>
  );
}

// ── Pantalla de resultado de pago ─────────────────────────────────────────────

function PaymentResultScreen({
  status,
  product,
  exitHref,
  errorMessage,
  onRetry,
}: {
  status: 'approved' | 'declined';
  product: ProductSummary;
  exitHref: string;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const isOk = status === 'approved';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-page, var(--clr-bg-light))' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full text-center rounded-3xl p-10"
        style={{
          background: 'var(--bg-surface, var(--clr-bg))',
          border: `2px solid ${isOk ? 'var(--clr-success)' : 'var(--color-error)'}`,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {isOk ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{ background: 'var(--success-bg)' }}
            >
              <CheckCircle2 size={40} style={{ color: 'var(--clr-success)' }} />
            </motion.div>
            <h1 className="font-black text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
              ¡Pago exitoso!
            </h1>
            <p className="text-sm mb-2" style={{ color: 'var(--clr-muted)' }}>
              Tu acceso a <strong>{product.title}</strong> ha sido activado.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--clr-muted)' }}>
              Recibirás un email de confirmación con todos los detalles.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="/student/home"
                className="block w-full py-3.5 rounded-xl font-bold text-white text-center"
                style={{ background: 'var(--clr-success)' }}
              >
                Ir a mi portal →
              </a>
              <a
                href={exitHref}
                className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
                style={{ color: 'var(--clr-muted)', border: '1.5px solid var(--clr-border)' }}
              >
                Volver al inicio
              </a>
            </div>
          </>
        ) : (
          <>
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{ background: 'var(--danger-bg)' }}
            >
              <XCircle size={40} style={{ color: 'var(--color-error)' }} />
            </div>
            <h1 className="font-black text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
              Pago no procesado
            </h1>
            <p className="text-sm mb-2" style={{ color: 'var(--clr-muted)' }}>
              {errorMessage ?? 'El pago fue rechazado por el banco o entidad financiera.'}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--clr-muted)' }}>
              No se realizó ningún cargo. Puedes intentar con otro método de pago.
            </p>
            <div className="flex flex-col gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="w-full py-3.5 rounded-xl font-bold text-white"
                  style={{ background: 'var(--clr-primary)' }}
                >
                  Intentar de nuevo
                </button>
              )}
              <a
                href={exitHref}
                className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
                style={{ color: 'var(--clr-muted)', border: '1.5px solid var(--clr-border)' }}
              >
                Volver al inicio
              </a>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
