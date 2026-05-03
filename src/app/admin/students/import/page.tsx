'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Upload, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminStudentsImportPage() {
    const router = useRouter();

    return (
        <div>
            <PageHeader
                title="Importar estudiantes"
                subtitle="Carga masiva desde archivo CSV"
            />

            <div style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px',
                textAlign: 'center' as const,
                background: 'var(--bg-surface-2)',
                cursor: 'pointer',
                marginBottom: '24px',
            }}>
                <Upload size={32} color="var(--text-muted)" />
                <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
                    Arrastra tu archivo CSV aquí o haz clic para seleccionar
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Formato requerido: nombre, apellido, email, numero_identificacion
                </p>
                <button className="btn-secondary" style={{ marginTop: '16px' }}>
                    Seleccionar archivo
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} color="var(--brand)" />
                <button
                    style={{
                        background: 'none', border: 'none',
                        color: 'var(--brand)', fontSize: '14px',
                        fontWeight: '500', cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    Descargar plantilla CSV
                </button>
            </div>
        </div>
    );
}
