'use client';

/**
 * /checkout — Checkout de cursos (el flujo original).
 * Usa PaymentMethods universal con onApproved para inscripción automática.
 */

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckoutPage as UniversalCheckoutPage, type PaymentStatus } from '@/features/checkout/CheckoutPage';
import { PaymentMethods } from '@/features/checkout/components/PaymentMethods';
import type { ProductSummary } from '@/features/checkout/config/checkout.config';
import type { DiscountResult } from '@/features/checkout/components/CheckoutSummary';
import { useAuth } from '@/hooks/use-auth';
import { getCursoBySlug } from '@/data/cursos';
import { useEffect } from 'react';

// ── Contenido principal ───────────────────────────────────────────────────────

function CursoCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, initialized } = useAuth();

  const cursoSlug     = searchParams.get('curso') ?? '';
  const grupoId       = searchParams.get('grupo') ?? undefined;
  const cohortId      = searchParams.get('cohortId') ?? searchParams.get('cohort') ?? undefined;
  const templateId    = searchParams.get('templateId') ?? searchParams.get('template') ?? undefined;
  const institutionId = searchParams.get('institutionId') ?? searchParams.get('institution') ?? undefined;

  const curso = getCursoBySlug(cursoSlug);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentError, setPaymentError]   = useState<string | undefined>();

  useEffect(() => {
    if (initialized && !user) router.push(`/formacion/${cursoSlug}`);
  }, [initialized, user, router, cursoSlug]);

  const handleComplete = useCallback(
    async (_formData: Record<string, unknown>, _discount: DiscountResult | null) => {
      // Pago manejado por PaymentMethods
    },
    [],
  );

  const handlePaymentStatus = useCallback((status: PaymentStatus, error?: string) => {
    setPaymentStatus(status);
    if (error) setPaymentError(error);
  }, []);

  // Inscripción al curso tras pago aprobado con tarjeta
  const handleEnrollment = useCallback(
    async (transactionId: string, method: string) => {
      if (!user) return;
      try {
        const { getAuth } = await import('firebase/auth');
        const idToken = await getAuth().currentUser?.getIdToken();
        if (!idToken) return;

        await fetch('/api/enrollment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            email: user.email,
            nombre: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
            telefono: user.phoneNumber ?? '',
            cursoSlug,
            cohortId: cohortId ?? grupoId ?? '',
            templateId: templateId ?? '',
            institutionId: institutionId ?? 'jomar-seguridad',
            paymentId: transactionId,
            paymentMethod: method,
            amountPaid: curso?.precioCOP ?? 0,
            grupoId: grupoId ?? '',
          }),
        });

        setTimeout(() => router.push('/student/home?pago=exitoso'), 2500);
      } catch {
        // Non-fatal: payment succeeded, enrollment can be retried via webhook
      }
    },
    [user, cursoSlug, grupoId, cohortId, templateId, institutionId, curso, router],
  );

  if (!curso) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-page, var(--clr-bg-light))' }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 animate-spin"
            style={{ border: '3px solid var(--clr-border)', borderTop: '3px solid var(--clr-primary)' }}
          />
          <p className="text-sm font-bold" style={{ color: 'var(--clr-muted)' }}>
            Cargando curso…
          </p>
        </div>
      </div>
    );
  }

  const product: ProductSummary = {
    kind: 'curso_web',
    productId: cursoSlug,
    title: curso.nombre,
    subtitle: 'Certificado AHA 2025',
    icon: 'graduation-cap',
    priceCOP: curso.precioCOP,
    features: ['Certificado AHA incluido', 'Acceso inmediato al aula', 'Soporte personalizado'],
  };

  return (
    <UniversalCheckoutPage
      productKind="curso_web"
      product={product}
      onComplete={handleComplete}
      exitHref={`/formacion/${cursoSlug}`}
      paymentStatus={paymentStatus}
      paymentError={paymentError}
      isSubmitting={paymentStatus === 'pending'}
      paymentSlot={
        <PaymentMethods
          amountCOP={curso.precioCOP}
          productId={cursoSlug}
          productTitle={curso.nombre}
          customerEmail={user?.email}
          onStatusChange={handlePaymentStatus}
          onApproved={handleEnrollment}
        />
      }
    />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CursoCheckoutContent />
    </Suspense>
  );
}

function CheckoutSkeleton() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-page, var(--clr-bg-light))' }}
    >
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full mx-auto mb-4 animate-spin"
          style={{ border: '3px solid var(--clr-border)', borderTop: '3px solid var(--clr-primary)' }}
        />
        <p className="text-sm font-bold" style={{ color: 'var(--clr-muted)' }}>
          Cargando checkout…
        </p>
      </div>
    </div>
  );
}
