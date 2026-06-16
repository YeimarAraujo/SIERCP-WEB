'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/page/Navbar';
import toast from 'react-hot-toast';
import Footer from '@/components/page/Footer';
import { Check, Clock, X, ArrowRight } from 'lucide-react';
import { corporatePlans, maniquiPackages, sstConLicenciaPlans, sstSinLicenciaPlans } from '@/data/planes';
import { getTransactionStatus, type WompiTransactionStatus } from '@/services/wompi.service';
import { useAuth } from '@/hooks/use-auth';
import VideoLoader from '@/components/video-loader';

function fmt(n: number) { return `$${n.toLocaleString('es-CO')}`; }

// ── Simulated result (from demo checkout pages) ───────────────────────────────

type ProductType = 'plan' | 'manikin' | 'licencia-sst' | 'pack';
type SimStatus = 'approved' | 'pending' | 'failed';

function getProduct(type: ProductType, plan?: string | null, pack?: string | null) {
    if (type === 'plan' && plan) {
        const p = corporatePlans.find(x => x.slug === plan);
        return p ? { name: p.name, price: `${fmt(p.monthlyCOP)} COP/mes`, desc: 'Plan corporativo mensual' } : null;
    }
    if (type === 'manikin' && pack) {
        const p = maniquiPackages.find(x => x.slug === pack);
        return p ? { name: p.name, price: `${fmt(p.totalPriceCOP ?? 0)} COP`, desc: 'Maniquíes SIERCP — pago único' } : null;
    }
    if (type === 'licencia-sst' && plan) {
        const p = sstConLicenciaPlans.find(x => x.slug === plan);
        return p ? { name: p.name, price: `${fmt(p.monthlyCOP)} COP/mes`, desc: 'Licencia SST mensual' } : null;
    }
    if (type === 'pack' && pack) {
        const p = sstSinLicenciaPlans.find(x => x.slug === pack);
        return p ? { name: p.name, price: `${fmt(p.monthlyCOP)} COP`, desc: 'Pack de certificados — pago único' } : null;
    }
    return null;
}

function getCTA(type: ProductType): { label: string; href: string } {
    switch (type) {
        case 'plan': return { label: 'Ir al panel de control', href: '/admin/dashboard' };
        case 'manikin': return { label: 'Volver al inicio', href: '/' };
        case 'licencia-sst': return { label: 'Ir a mi perfil', href: '/student/profile' };
        case 'pack': return { label: 'Mis certificados', href: '/student/certificates' };
    }
}

function SimResult({ type, status, plan, pack }: { type: ProductType; status: SimStatus; plan?: string | null; pack?: string | null }) {
    const router = useRouter();
    const product = getProduct(type, plan, pack);
    const cta = getCTA(type);

    const statusConfig = {
        approved: { Icon: Check, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', label: 'Pago aprobado', desc: 'Tu compra fue procesada exitosamente.' },
        pending: { Icon: Clock, color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pago pendiente', desc: 'Tu pago está siendo procesado. Te notificaremos por correo.' },
        failed: { Icon: X, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Pago fallido', desc: 'No se pudo procesar el pago. Intenta de nuevo o usa otro método.' },
    }[status];

    const { Icon } = statusConfig;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <main style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: statusConfig.bg, border: `2px solid ${statusConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Icon size={28} color={statusConfig.color} strokeWidth={2.5} />
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>{statusConfig.label}</h1>
                    <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{statusConfig.desc}</p>
                </div>

                {product && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, background: '#fff', padding: '22px 24px', marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Detalles del pedido</div>
                        {[
                            ['Producto', product.name],
                            ['Tipo', product.desc],
                            ['Total', product.price],
                            ['Estado', statusConfig.label],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280', fontWeight: 600 }}>{label}</span>
                                <span style={{ fontWeight: 700, color: label === 'Estado' ? statusConfig.color : '#111827' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {status !== 'failed' ? (
                        <button onClick={() => router.push(cta.href)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 10, border: 'none', background: '#1e3a5f', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                            {cta.label} <ArrowRight size={15} />
                        </button>
                    ) : (
                        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 10, border: 'none', background: '#1e3a5f', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                            Intentar de nuevo
                        </button>
                    )}
                    <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px 24px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                        Volver al inicio
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
}

// ── Wompi transaction polling (real payment flow) ─────────────────────────────

function WompiResult({ ref: txRef, transactionId }: { ref?: string | null; transactionId?: string | null }) {
    const router = useRouter();
    const { user } = useAuth();
    const [status, setStatus] = useState<WompiTransactionStatus | null>(null);
    const [amount, setAmount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [pollCount, setPollCount] = useState(0);
    const [enrollmentDone, setEnrollmentDone] = useState(false);

    useEffect(() => {
        if (status !== 'APPROVED' || !user || enrollmentDone) return;
        async function doEnrollment() {
            try {
                const { getAuth } = await import('firebase/auth');
                const fbAuth = getAuth();
                const currentUser = fbAuth.currentUser;
                if (!currentUser) return;
                const idToken = await currentUser.getIdToken();
                const res = await fetch('/api/enrollment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                    body: JSON.stringify({ paymentId: transactionId || '', amountPaid: amount || 0 }),
                });
                const body = await res.json();
                if (!res.ok) {
                    if (res.status === 409) return; // already enrolled
                    console.error('[Checkout] Enrollment failed:', body);
                    toast.error(body.error || body.message || 'Error al registrar la matrícula. Contacta a soporte.');
                }
            } catch (err) {
                console.error('[Checkout] Enrollment error:', err);
                toast.error('Error de red al registrar la matrícula. Contacta a soporte.');
            } finally {
                setEnrollmentDone(true);
            }
        }
        doEnrollment();
    }, [status, user, enrollmentDone, transactionId, amount]);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        async function poll() {
            try {
                let tx;
                if (transactionId) {
                    tx = await getTransactionStatus(transactionId);
                } else if (txRef) {
                    const wompiBaseUrl = process.env.NEXT_PUBLIC_WOMPI_ENV === 'production'
                        ? 'https://production.wompi.co/v1'
                        : 'https://sandbox.wompi.co/v1';
                    const res = await fetch(`${wompiBaseUrl}/transactions?reference=${txRef}`, {
                        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}` },
                    });
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
                    if (tx.status === 'APPROVED') setTimeout(() => router.push('/student/home?pago=exitoso'), 4000);
                }
            } catch { setStatus('ERROR'); setLoading(false); }
        }
        poll();
        return () => clearTimeout(timeoutId);
    }, [transactionId, txRef, pollCount]);

    const statusConfig: Record<string, { Icon: React.ElementType; color: string; bg: string; border: string; label: string; desc: string }> = {
        APPROVED: { Icon: Check, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', label: 'Pago aprobado', desc: 'Tu compra fue procesada exitosamente.' },
        PENDING: { Icon: Clock, color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pago pendiente', desc: 'Procesando tu pago. Te notificaremos por correo.' },
        DECLINED: { Icon: X, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Pago declinado', desc: 'El pago fue rechazado. Intenta con otro método.' },
        ERROR: { Icon: X, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Error', desc: 'No se pudo verificar el pago. Contacta soporte.' },
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #1e3a5f', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280', fontSize: 14 }}>Verificando pago…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const cfg = statusConfig[status ?? 'ERROR'];
    const { Icon } = cfg;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <main style={{ maxWidth: 500, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Icon size={28} color={cfg.color} strokeWidth={2.5} />
                </div>
                <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: '#111827' }}>{cfg.label}</h1>
                <p style={{ margin: '0 0 24px', fontSize: 15, color: '#6b7280' }}>{cfg.desc}</p>
                {amount && <div style={{ fontSize: 22, fontWeight: 900, color: '#1e3a5f', margin: '0 0 32px' }}>{fmt(amount)} COP</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={() => router.push('/student/home')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 10, border: 'none', background: '#1e3a5f', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                        Ir al inicio <ArrowRight size={15} />
                    </button>
                    {(status === 'DECLINED' || status === 'ERROR') && (
                        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px 24px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                            Intentar de nuevo
                        </button>
                    )}
                </div>
            </main>
            <Footer />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ── Router: decide which flow to use ─────────────────────────────────────────

function ResultContent() {
    const params = useSearchParams();
    const type = params.get('type') as ProductType | null;
    const status = params.get('status') as SimStatus | null;
    const plan = params.get('plan');
    const pack = params.get('pack');
    const ref = params.get('ref');
    const transactionId = params.get('id') || params.get('transaction_id');

    // Simulation path: came from demo checkout
    if (status && (status === 'approved' || status === 'pending' || status === 'failed')) {
        return <SimResult type={type ?? 'plan'} status={status} plan={plan} pack={pack} />;
    }

    // Real Wompi path
    return <WompiResult ref={ref} transactionId={transactionId} />;
}

export default function ResultadoPage() {
    return (
        <Suspense fallback={<VideoLoader fullScreen />}>
            <ResultContent />
        </Suspense>
    );
}
