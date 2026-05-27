'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getMerchantInfo,
  tokenizeCard,
  generateTransactionReference,
  getTransactionStatus,
  type WompiPaymentMethodPayload,
  type WompiTransactionStatus,
} from '@/services/wompi.service';
import type { CardFormData } from '@/components/CardForm';
import type { PSEFormData } from '@/components/PSEForm';
import { useAuth } from '@/hooks/use-auth';
import type { PaymentStatus } from '../CheckoutPage';

export type PaymentFlowStep =
  | 'idle'
  | 'tokenizing'
  | 'processing'
  | 'verifying'
  | 'redirecting'
  | 'done'
  | 'error';

interface UsePaymentFlowOptions {
  amountCOP: number;
  productId: string;
  /** Called once a card payment is APPROVED — use for enrollment, fulfillment, etc. */
  onApproved?: (transactionId: string, method: string) => Promise<void>;
  onStatusChange?: (status: PaymentStatus, error?: string) => void;
}

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 8;

async function pollUntilSettled(transactionId: string): Promise<WompiTransactionStatus> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const status = await getTransactionStatus(transactionId);
    if (status.status !== 'PENDING') return status.status;
  }
  return 'PENDING';
}

export function usePaymentFlow({
  amountCOP,
  productId,
  onApproved,
  onStatusChange,
}: UsePaymentFlowOptions) {
  const { user } = useAuth();

  const [step, setStep] = useState<PaymentFlowStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [acceptancePermalink, setAcceptancePermalink] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<WompiTransactionStatus | null>(null);

  const isLoading = (
    ['tokenizing', 'processing', 'verifying', 'redirecting'] as PaymentFlowStep[]
  ).includes(step);

  useEffect(() => {
    getMerchantInfo()
      .then((m) => setAcceptancePermalink(m.presigned_acceptance.permalink))
      .catch(() => {/* non-fatal */});
  }, []);

  useEffect(() => {
    if (!onStatusChange) return;
    if (transactionStatus === 'APPROVED') onStatusChange('approved');
    else if (transactionStatus === 'DECLINED') onStatusChange('declined', 'El banco rechazó el pago. Intenta con otro método.');
    else if (transactionStatus === 'ERROR' || transactionStatus === 'VOIDED') onStatusChange('error', 'Error al procesar el pago.');
  }, [transactionStatus, onStatusChange]);

  useEffect(() => {
    if (step === 'error' && error) onStatusChange?.('error', error);
  }, [step, error, onStatusChange]);

  async function getFirebaseIdToken(): Promise<string> {
    const { getAuth } = await import('firebase/auth');
    const fbAuth = getAuth();
    const current = fbAuth.currentUser;
    if (!current) throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
    return current.getIdToken();
  }

  async function getFreshAcceptanceToken(): Promise<string> {
    const merchant = await getMerchantInfo();
    return merchant.presigned_acceptance.acceptance_token;
  }

  async function createTransaction(
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
        product_id: productId,
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al procesar el pago');
    return json as {
      transaction_id: string;
      status: WompiTransactionStatus;
      redirect_url: string | null;
      payment_method_type: string;
      reference: string;
    };
  }

  const payWithCard = useCallback(
    async (cardData: CardFormData) => {
      if (!user) { onStatusChange?.('error', 'Debes iniciar sesión para continuar.'); return; }
      setError(null);
      onStatusChange?.('pending');

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
        const reference = generateTransactionReference(productId, user.uid);
        const freshToken = await getFreshAcceptanceToken();

        const result = await createTransaction(
          reference,
          { type: 'CARD', token: cardToken.id, installments: cardData.installments },
          user.email,
          cardData.legal_id,
          'CC',
          user.phoneNumber ?? '3000000000',
          `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
          freshToken,
        );

        let finalStatus = result.status;

        if (finalStatus === 'PENDING' && result.transaction_id) {
          setStep('verifying');
          finalStatus = await pollUntilSettled(result.transaction_id);
        }

        if (finalStatus === 'APPROVED' && onApproved) {
          await onApproved(result.transaction_id, 'CARD');
        }

        setTransactionStatus(finalStatus);
        setStep('done');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido al procesar el pago';
        setError(msg);
        setStep('error');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, productId, amountCOP, onApproved, onStatusChange],
  );

  const payWithPSE = useCallback(
    async (pseData: PSEFormData) => {
      if (!user) { onStatusChange?.('error', 'Debes iniciar sesión para continuar.'); return; }
      setError(null);
      onStatusChange?.('pending');

      try {
        setStep('processing');
        const reference = generateTransactionReference(productId, user.uid);
        const freshToken = await getFreshAcceptanceToken();

        const result = await createTransaction(
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
          `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
          freshToken,
        );

        if (!result.redirect_url) {
          throw new Error('No se recibió la URL de redirección del banco');
        }

        setStep('redirecting');
        window.location.href = result.redirect_url;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido al procesar el pago';
        setError(msg);
        setStep('error');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, productId, amountCOP, onStatusChange],
  );

  return {
    step,
    error,
    isLoading,
    termsAccepted,
    setTermsAccepted,
    acceptancePermalink,
    transactionStatus,
    payWithCard,
    payWithPSE,
  };
}
