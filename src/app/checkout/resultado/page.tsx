'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Spinner } from 'react-bootstrap';
import { getTransactionStatus, type WompiTransactionStatus } from '@/services/wompi.service';
import ResultadoModal from '@/components/ResultadoModal';
import { useAuth } from '@/hooks/use-auth';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';

function ResultadoContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const ref = searchParams.get('ref');
    const transactionId = searchParams.get('id') || searchParams.get('transaction_id');

    const [status, setStatus] = useState<WompiTransactionStatus | null>(null);
    const [amount, setAmount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [pollCount, setPollCount] = useState(0);
    const [enrollmentDone, setEnrollmentDone] = useState(false);

    // ─── Complete enrollment after APPROVED ──────────────────────────────

    useEffect(() => {
        if (status !== 'APPROVED' || !user || enrollmentDone) return;

        async function doEnrollment() {
            try {
                const { getAuth } = await import('firebase/auth');
                const fbAuth = getAuth();
                const currentUser = fbAuth.currentUser;
                if (!currentUser) return;
                const idToken = await currentUser.getIdToken();

                // Extract enrollment context from URL params
                const cursoSlug = searchParams.get('curso') || searchParams.get('ref')?.split('-')[0] || '';
                const cohortId = searchParams.get('cohortId') || searchParams.get('cohort') || '';
                const templateId = searchParams.get('templateId') || searchParams.get('template') || '';
                const institutionId = searchParams.get('institutionId') || searchParams.get('institution') || 'jomar-seguridad';
                const grupoId = searchParams.get('grupoId') || searchParams.get('grupo') || '';

                const userEmail = user?.email || '';
                const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || userEmail;
                const userPhone = user?.phoneNumber || '';

                const res = await fetch('/api/enrollment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        nombre: userName,
                        telefono: userPhone,
                        cursoSlug,
                        cohortId: cohortId || grupoId,
                        templateId,
                        institutionId,
                        paymentId: transactionId || '',
                        paymentMethod: 'PSE',
                        amountPaid: amount || 0,
                        grupoId,
                    }),
                });

                const json = await res.json();
                if (res.ok || res.status === 409) {
                    console.log('[Resultado] Enrollment completed:', json);
                } else {
                    console.error('[Resultado] Enrollment failed:', json);
                }
            } catch (err) {
                console.error('[Resultado] Enrollment error (non-fatal):', err);
            } finally {
                setEnrollmentDone(true);
            }
        }

        doEnrollment();
    }, [status, user, enrollmentDone]);

    // ─── Poll Wompi for transaction status ───────────────────────────────

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        async function poll() {
            try {
                // Buscar por transactionId si existe, si no por referencia
                let tx;
                if (transactionId) {
                    tx = await getTransactionStatus(transactionId);
                } else if (ref) {
                    // Buscar por referencia usando el endpoint público de Wompi
                    const wompiBaseUrl = process.env.NEXT_PUBLIC_WOMPI_ENV === 'production'
                        ? 'https://production.wompi.co/v1'
                        : 'https://sandbox.wompi.co/v1';
                    const res = await fetch(
                        `${wompiBaseUrl}/transactions?reference=${ref}`,
                        { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}` } }
                    );
                    const json = await res.json();
                    tx = json.data?.[0];
                }

                if (!tx) { setStatus('ERROR'); setLoading(false); return; }

                setAmount(tx.amount_in_cents / 100);

                if (tx.status === 'PENDING' && pollCount < 5) {
                    setPollCount(c => c + 1);
                    timeoutId = setTimeout(poll, 3000);
                } else {
                    setStatus(tx.status);
                    setLoading(false);
                    if (tx.status === 'APPROVED') {
                        setTimeout(() => router.push('/student/home?pago=exitoso'), 4000);
                    }
                }
            } catch {
                setStatus('ERROR');
                setLoading(false);
            }
        }

        poll();
        return () => clearTimeout(timeoutId);
    }, [transactionId, ref]);

    return (
        // Fondo oscuro que cubre toda la pantalla
        <div style={{ minHeight: '100vh', background: 'var(--clr-bg)' }}>
            <ResultadoModal
                open={true}
                loading={loading}
                status={status}
                amount={amount}
                reference={ref}
                onRetry={() => router.back()}
                onGoToCourses={() => router.push('/student/home')}
            />
        </div>
    );
}

export default function ResultadoPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><Spinner animation="border" /></div>}>
            <ResultadoContent />
        </Suspense>
    );
}