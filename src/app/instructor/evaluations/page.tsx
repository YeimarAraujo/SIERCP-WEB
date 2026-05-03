'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { CheckSquare } from 'lucide-react';

export default function InstructorEvaluationsPage() {
    const columns = [
        { key: 'student', label: 'Estudiante' },
        { key: 'course', label: 'Curso' },
        { key: 'sessions', label: 'Sesiones' },
        { key: 'ahaScore', label: 'Score AHA' },
        { key: 'recoil', label: 'Recoil' },
        { key: 'avgDepth', label: 'Profundidad prom' },
        { key: 'avgRate', label: 'Frecuencia prom' },
        {
            key: 'result', label: 'Resultado',
            render: (val: unknown) => {
                const results: Record<string, { bg: string; text: string; label: string }> = {
                    'approved': { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'Aprobado' },
                    'in_progress': { bg: 'var(--info-bg)', text: 'var(--info-text)', label: 'En progreso' },
                    'needs_improvement': { bg: 'var(--warning-bg)', text: 'var(--warning-text)', label: 'Necesita mejorar' },
                };
                const r = results[val as string] || { bg: 'var(--bg-surface-2)', text: 'var(--text-muted)', label: String(val) };
                return (
                    <span style={{ background: r.bg, color: r.text, padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '600' }}>
                        {r.label}
                    </span>
                );
            },
        },
        {
            key: 'actions', label: 'Acciones',
            render: () => (
                <button style={{
                    background: 'var(--brand-light)', color: 'var(--brand)',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>
                    Ver detalle
                </button>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Evaluaciones"
                subtitle="Revisión automática de desempeño AHA"
            />

            <div className="card-padded" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Curso
                    </label>
                    <select className="input-field">
                        <option value="">Todos los cursos</option>
                    </select>
                </div>
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
            </div>

            <DataTable
                columns={columns}
                data={[]}
                emptyMessage="No hay evaluaciones disponibles"
            />
        </div>
    );
}
