'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Smartphone, Apple, PlayCircle } from 'lucide-react';

export default function StudentDownloadPage() {
    return (
        <div>
            <PageHeader
                title="Descargar app SIERCP"
                subtitle="Practica RCP desde tu dispositivo móvil"
            />

            <div className="card-padded" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3 style={{
                    fontSize: '18px', fontWeight: '700',
                    color: 'var(--text-primary)', margin: '0 0 16px',
                }}>
                    ¿Cómo funciona?
                </h3>
                <ol style={{
                    padding: '0 0 0 20px', margin: '0 0 24px',
                    color: 'var(--text-secondary)', fontSize: '14px',
                    lineHeight: '2',
                }}>
                    <li>Descarga la app en tu dispositivo</li>
                    <li>Inicia sesión con tu cuenta SIERCP</li>
                    <li>Conecta tu maniquí via Bluetooth</li>
                    <li>¡Comienza a practicar!</li>
                </ol>

                <div className="divider" />

                <div style={{
                    display: 'flex', gap: '16px', marginTop: '24px',
                    flexWrap: 'wrap',
                }}>
                    <button
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px', justifyContent: 'center' }}
                    >
                        <PlayCircle size={20} />
                        Descargar para Android
                    </button>
                    <button
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px', justifyContent: 'center' }}
                    >
                        <Apple size={20} />
                        Descargar para iOS
                    </button>
                </div>

                <p style={{
                    color: 'var(--text-muted)', fontSize: '13px',
                    marginTop: '24px', textAlign: 'center' as const,
                }}>
                    Versión actual: 1.0.0 — Compatible con Android 8+ y iOS 13+
                </p>
            </div>
        </div>
    );
}
