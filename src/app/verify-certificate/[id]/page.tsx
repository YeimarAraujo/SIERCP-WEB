'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CertificateService, type CertificateRecord } from '@/features/certificates/services/certificate.service';
import { AuditService } from '@/features/audit/services/audit.service';

function formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(value);
}

export default function VerifyCertificatePage({ params }: { params: { id: string } }) {
    const [certificateId] = useState(params.id);
    const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!certificateId) return;
        setLoading(true);
        CertificateService.getPublic(certificateId)
            .then((record) => {
                setCertificate(record);
                AuditService.record({
                    action: 'certificate.verify',
                    resource: 'certificate',
                    resourceId: certificateId,
                    institutionId: record?.institutionId,
                    metadata: { status: record?.status || 'not-found' },
                });
            })
            .finally(() => setLoading(false));
    }, [certificateId]);

    return (
        <main style={{
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: 'radial-gradient(circle at top left, rgba(24,0,173,.14), transparent 35%), linear-gradient(135deg, #f8fafc, #eef2ff)',
        }}>
            <section style={{
                width: 'min(940px, 100%)',
                borderRadius: 34,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: '0 30px 80px rgba(15,23,42,.14)',
                border: '1px solid rgba(148,163,184,.25)',
            }}>
                <div style={{
                    padding: '28px 32px',
                    background: 'linear-gradient(135deg, #1800AD, #0f172a)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 20,
                    flexWrap: 'wrap',
                }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.13)', fontSize: 12, fontWeight: 800 }}>
                            <ShieldCheck size={15} />
                            Verificación pública SIERCP
                        </div>
                        <h1 style={{ margin: '14px 0 4px', fontSize: 34, fontWeight: 950, letterSpacing: '-0.04em' }}>Certificado verificable</h1>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,.78)' }}>Consulta de autenticidad por folio emitido por JOMAR SEGURID / SIERCP.</p>
                    </div>
                    <Award size={54} />
                </div>

                <div style={{ padding: 32 }}>
                    {loading ? (
                        <div style={{ display: 'grid', gap: 14 }}>
                            {[1, 2, 3].map((item) => <div key={item} style={{ height: 54, borderRadius: 16, background: '#f1f5f9', animation: 'pulse 1.4s infinite' }} />)}
                            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
                        </div>
                    ) : certificate && certificate.status === 'issued' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 180px', gap: 28, alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: '#16a34a', background: '#dcfce7', padding: '9px 12px', borderRadius: 999, fontWeight: 900, marginBottom: 18 }}>
                                    <CheckCircle2 size={18} />
                                    Certificado válido
                                </div>
                                <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 30, fontWeight: 950 }}>{certificate.studentName}</h2>
                                <p style={{ margin: '0 0 22px', color: '#475569', fontSize: 16 }}>{certificate.certification}</p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                                    <Info label="Puntaje AHA" value={`${Math.round(certificate.score)}%`} />
                                    <Info label="Emisión" value={formatDate(certificate.issuedAt)} />
                                    <Info label="Folio" value={certificate.verificationCode} />
                                    <Info label="Institución" value={certificate.institutionId || 'SIERCP'} />
                                </div>
                            </div>
                            <div style={{ padding: 18, border: '1px solid #e2e8f0', borderRadius: 24, display: 'grid', placeItems: 'center', background: '#f8fafc' }}>
                                <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : certificateId} size={132} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: 28, borderRadius: 22, background: '#fef2f2', color: '#991b1b', display: 'flex', gap: 14 }}>
                            <AlertTriangle size={22} />
                            <div>
                                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900 }}>Certificado no encontrado o no vigente</h2>
                                <p style={{ margin: 0 }}>Verifica el folio o solicita a la institución emisora generar nuevamente el certificado.</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
            <div style={{ color: '#0f172a', fontSize: 16, fontWeight: 900, marginTop: 5, wordBreak: 'break-word' }}>{value}</div>
        </div>
    );
}
