'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getMerchantInfo,
  tokenizeCard,
  generateTransactionReference,
  getTransactionStatus,
  type WompiPaymentMethodPayload,
  type WompiTransactionStatus,
} from '@/services/wompi.service';
import { type CardFormData } from '@/components/CardForm';
import { type PSEFormData } from '@/components/PSEForm';
import { useAuth } from '@/hooks/use-auth';

export type CheckoutStep =
  | 'idle'
  | 'tokenizing'
  | 'processing'
  | 'verifying'
  | 'redirecting'
  | 'enrolling'
  | 'done'
  | 'error';

interface UseWompiCheckoutOptions {
  cursoSlug: string;
  grupoId?: string;
  /** New LMS cohort system fields */
  cohortId?: string;
  templateId?: string;
  institutionId?: string;
  amountCOP: number;
}

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 8;

async function pollTransactionStatus(transactionId: string): Promise<WompiTransactionStatus> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise(res => setTimeout(res, POLL_INTERVAL_MS));
    }
    const tx = await getTransactionStatus(transactionId);
    if (tx.status !== 'PENDING') return tx.status;
  }
  return 'PENDING';
}

export function useWompiCheckout({ cursoSlug, grupoId, cohortId, templateId, institutionId, amountCOP }: UseWompiCheckoutOptions) {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<CheckoutStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [acceptancePermalink, setAcceptancePermalink] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalStatus, setModalStatus] = useState<WompiTransactionStatus | null>(null);
  const [modalAmount, setModalAmount] = useState<number | null>(null);
  const [modalRef, setModalRef] = useState<string | null>(null);

  const loadMerchant = useCallback(async () => {
    try {
      const merchant = await getMerchantInfo();
      setAcceptancePermalink(merchant.presigned_acceptance.permalink);
    } catch (err) {
      console.error('[useWompiCheckout] loadMerchant:', err);
    }
  }, []);

  async function getFreshAcceptanceToken(): Promise<string> {
    const merchant = await getMerchantInfo();
    return merchant.presigned_acceptance.acceptance_token;
  }

  async function getFirebaseIdToken(): Promise<string> {
    const { getAuth } = await import('firebase/auth');
    const fbAuth = getAuth();
    const currentUser = fbAuth.currentUser;
    if (!currentUser) throw new Error('Sesión expirada. Por favor vuelve a iniciar sesión.');
    return currentUser.getIdToken();
  }

  // ─── Enrollment after APPROVED payment ──────────────────────────────────

  async function completeEnrollment(paymentId: string, paymentMethod: string) {
    if (!user) return;

    try {
      setStep('enrolling');
      const idToken = await getFirebaseIdToken();

      const res = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: user.email,
          nombre: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          telefono: user.phoneNumber || '',
          cursoSlug,
          cohortId: cohortId || grupoId || '',
          templateId: templateId || '',
          institutionId: institutionId || 'jomar-seguridad',
          paymentId,
          paymentMethod,
          amountPaid: amountCOP,
          grupoId: grupoId || '',
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          console.log('[Checkout] Already enrolled:', json);
          return;
        }
        console.error('[Checkout] Enrollment failed:', json);
        toast.error(`Error al registrar la matrícula: ${json.error || json.message || 'Error desconocido'}`);
      } else {
        console.log('[Checkout] Enrollment completed:', json);
      }
    } catch (enrollErr) {
      console.error('[Checkout] Enrollment error:', enrollErr);
      toast.error('Error de red al registrar la matrícula. Contacta a soporte.');
    }
  }

  // ─── Server transaction creation ────────────────────────────────────────

  async function createServerTransaction(
    reference: string,
    paymentMethod: WompiPaymentMethodPayload,
    customerEmail: string,
    legalId: string,
    legalIdType: string,
    phoneNumber: string,
    fullName: string,
    freshAcceptanceToken: string,
  ) {
    const idToken = await getFirebaseIdToken();

    const res = await fetch('/api/wompi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        reference,
        amount_in_cents: amountCOP * 100,
        currency: 'COP',
        customer_email: customerEmail,
        payment_method: paymentMethod,
        customer_data: {
          phone_number: phoneNumber,
          full_name: fullName,
          legal_id: legalId,
          legal_id_type: legalIdType,
        },
        acceptance_token: freshAcceptanceToken,
        curso_slug: cursoSlug,
        grupo_id: grupoId,
        // LMS cohort system fields
        cohort_id: cohortId,
        template_id: templateId,
        institution_id: institutionId,
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al procesar el pago');
    return json as {
      transaction_id: string;
      status: string;
      redirect_url: string | null;
      payment_method_type: string;
      reference: string;
    };
  }

  // ─── Pago con tarjeta ────────────────────────────────────────────────────

  const payWithCard = useCallback(async (cardData: CardFormData) => {
    if (!user) return;
    setError(null);

    try {
      setStep('tokenizing');
      const cardToken = await tokenizeCard({
        number: cardData.number,
        cvc: cardData.cvc,
        exp_month: cardData.exp_month,
        exp_year: cardData.exp_year,
        card_holder: cardData.card_holder,
      });

      setStep('processing');
      const reference = generateTransactionReference(cursoSlug, user.uid);
      const freshToken = await getFreshAcceptanceToken();

      const result = await createServerTransaction(
        reference,
        { type: 'CARD', token: cardToken.id, installments: cardData.installments },
        user.email,
        cardData.legal_id,
        'CC',
        user.phoneNumber ?? '3000000000',
        `${user.firstName} ${user.lastName}`,
        freshToken,
      );

      let finalStatus = result.status as WompiTransactionStatus;

      if (finalStatus === 'PENDING' && result.transaction_id) {
        setStep('verifying');
        setModalRef(reference);
        setModalAmount(amountCOP);
        setModalLoading(true);
        setModalOpen(true);

        finalStatus = await pollTransactionStatus(result.transaction_id);
        setModalLoading(false);
      }

      // ─── KEY FIX: Create enrollment when payment is APPROVED ──────────
      if (finalStatus === 'APPROVED') {
        await completeEnrollment(result.transaction_id, 'CARD');
      }

      setStep('done');
      setModalRef(reference);
      setModalAmount(amountCOP);
      setModalStatus(finalStatus);
      setModalOpen(true);

      if (finalStatus === 'APPROVED') {
        setTimeout(() => router.push('/student/home?pago=exitoso'), 3000);
      }
    } catch (err: unknown) {
      setStep('error');
      setModalOpen(false);
      setModalLoading(false);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [user, cursoSlug, grupoId, cohortId, templateId, institutionId, amountCOP]);

  // ─── Pago con PSE ────────────────────────────────────────────────────────

  const payWithPSE = useCallback(async (pseData: PSEFormData) => {
    if (!user) return;
    setError(null);

    try {
      setStep('processing');
      const reference = generateTransactionReference(cursoSlug, user.uid);
      const freshToken = await getFreshAcceptanceToken();

      const result = await createServerTransaction(
        reference,
        {
          type: 'PSE',
          user_type: pseData.user_type,
          user_legal_id_type: pseData.user_legal_id_type,
          user_legal_id: pseData.user_legal_id,
          financial_institution_code: pseData.financial_institution_code,
          payment_description: pseData.payment_description,
        },
        user.email,
        pseData.user_legal_id,
        pseData.user_legal_id_type,
        user.phoneNumber ?? '3000000000',
        `${user.firstName} ${user.lastName}`,
        freshToken,
      );

      if (!result.redirect_url) {
        throw new Error('No se recibió la URL de redirección del banco');
      }

      setStep('redirecting');
      window.location.href = result.redirect_url;
    } catch (err: unknown) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [user, cursoSlug, grupoId, amountCOP]);

  return {
    step,
    error,
    termsAccepted,
    setTermsAccepted,
    acceptancePermalink,
    loadMerchant,
    payWithCard,
    payWithPSE,
    isLoading: (['tokenizing', 'processing', 'verifying', 'redirecting', 'enrolling'] as CheckoutStep[]).includes(step),
    modalOpen,
    modalLoading,
    modalStatus,
    modalAmount,
    modalRef,
    closeModal: () => {
      setModalOpen(false);
      setModalLoading(false);
      setModalStatus(null);
      setStep('idle');
    },
  };
}