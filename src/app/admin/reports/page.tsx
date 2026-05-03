'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Download } from 'lucide-react';

export default function AdminReportsPage() {
    const columns = [
        { key: 'instructor', label: 'Instructor' },
        { key: 'course', label: 'Curso' },
        { key: 'sessions', label: 'Sesiones' },
        { key: 'score', label: 'Score promedio' },
        { key: 'aha', label: 'Cumplimiento AHA' },
        { key: 'date', label: 'Fecha' },
    ];

    return (
        <div>
            <PageHeader
                title="Reportes"
                subtitle="Genera y exporta reportes de tu institución"
            />

            <div className="card-padded" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1', minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Período
                    </label>
                    <select className="input-field">
                        <option>Esta semana</option>
                        <option>Este mes</option>
                        <option>Este año</option>
                    </select>
                </div>
                <div style={{ flex: '1', minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Instructor
                    </label>
                    <select className="input-field">
                        <option value="">Todos los instructores</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Exportar
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} />
                            PDF
                        </button>
                        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={16} />
                            CSV
                        </button>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={[]}
                emptyMessage="No hay reportes disponibles para el período seleccionado"
            />
        </div>
    );
}
