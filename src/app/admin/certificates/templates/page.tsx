'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { CertificateService, DEFAULT_CERTIFICATE_TEMPLATE, type CertificateTemplate } from '@/features/certificates/services/certificate.service';
import { useAuth } from '@/hooks/use-auth';

export default function CertificateTemplatePreviewPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [template, setTemplate] = useState<CertificateTemplate>(DEFAULT_CERTIFICATE_TEMPLATE);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        CertificateService.getTemplate(user?.institutionId)
            .then(setTemplate)
            .finally(() => setLoading(false));
    }, [user?.institutionId]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Plantillas de Certificado" />
            <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
                <button onClick={() => router.push('/admin/certificates')} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18, cursor: 'pointer' }}>
                    <ArrowLeft size={17} />
                    Volver a certificados
                </button>

                <div style={{
                    borderRadius: 30,
                    padding: 26,
                    color: 'var(--text-on-brand)',
                    background: 'linear-gradient(135deg, var(--brand), #0f172a)',
                    boxShadow: '0 18px 44px rgba(24,0,173,.20)',
                    marginBottom: 24,
                }}>
                    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.13)', fontSize: 12, fontWeight: 900, marginBottom: 12 }}>
                        <BadgeCheck size={15} />
                        Template JSON coordinates
                    </div>
                    <h1 style={{ margin: 0, fontSize: 34, fontWeight: 950, letterSpacing: '-0.04em' }}>Arquitectura de certificados</h1>
                    <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,.78)', maxWidth: 740 }}>
                        Vista previa de plantilla escalable. Se lee desde <strong>certificateTemplates</strong> si existe y usa fallback JOMAR estándar sin migraciones destructivas.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, .7fr)', gap: 24 }}>
                    <div style={{
                        minHeight: 430,
                        borderRadius: 28,
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 12px 28px rgba(15,23,42,.08)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{ height: 92, background: 'var(--brand)', display: 'flex', alignItems: 'center', padding: '0 32px' }}>
                            <img src={template.logoPath} alt="JOMAR" style={{ height: 54, objectFit: 'contain' }} />
                        </div>
                        <div style={{ position: 'absolute', inset: '92px 0 0', background: 'radial-gradient(circle at top right, rgba(24,0,173,.08), transparent 34%)' }} />
                        {template.fields.map((field) => (
                            <div
                                key={field.key}
                                style={{
                                    position: 'absolute',
                                    left: `${(field.x / 792) * 100}%`,
                                    top: `${(field.y / 612) * 100}%`,
                                    transform: field.align === 'center' ? 'translateX(-50%)' : field.align === 'right' ? 'translateX(-100%)' : undefined,
                                    fontSize: Math.max(11, field.fontSize * 0.75),
                                    fontWeight: field.key === 'studentName' ? 950 : 800,
                                    color: field.key === 'studentName' ? 'var(--foreground)' : 'var(--text-secondary)',
                                    textAlign: field.align || 'left',
                                    padding: '3px 6px',
                                    borderRadius: 8,
                                    outline: '1px dashed rgba(24,0,173,.25)',
                                    background: 'rgba(255,255,255,.72)',
                                }}
                            >
                                {field.label}
                            </div>
                        ))}
                    </div>

                    <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                        <div style={{ padding: 22, borderRadius: 24, background: 'var(--card)', border: '1px solid var(--border)' }}>
                            <FileText color="var(--brand)" />
                            <h2 style={{ margin: '12px 0 4px', fontSize: 20, fontWeight: 900, color: 'var(--foreground)' }}>{loading ? 'Cargando...' : template.name}</h2>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Plantilla actual: {template.id}. Orientación {template.page.orientation}, formato {template.page.format}.
                            </p>
                        </div>
                        <div style={{ padding: 22, borderRadius: 24, background: 'var(--card)', border: '1px solid var(--border)' }}>
                            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 900, color: 'var(--foreground)' }}>Campos renderizables</h3>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {template.fields.map((field) => (
                                    <div key={field.key} style={{ padding: 12, borderRadius: 14, background: 'var(--muted)', border: '1px solid var(--border)', fontSize: 13 }}>
                                        <strong>{field.key}</strong>
                                        <div style={{ color: 'var(--text-secondary)' }}>x:{field.x} y:{field.y} size:{field.fontSize}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
