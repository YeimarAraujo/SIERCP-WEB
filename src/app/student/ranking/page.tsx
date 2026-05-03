'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Trophy } from 'lucide-react';

export default function StudentRankingPage() {
    const podiumStyles = [
        { bg: '#FFD700', color: '#5C4300' },
        { bg: '#C0C0C0', color: '#3D3D3D' },
        { bg: '#CD7F32', color: '#3D2100' },
    ];

    const columns = [
        {
            key: 'rank', label: '#',
            render: (_: unknown, row: Record<string, unknown>) => {
                const rank = Number(row.rank);
                const style = podiumStyles[rank - 1];
                if (rank <= 3 && style) {
                    return (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: style.bg, color: style.color,
                            fontSize: '13px', fontWeight: '700',
                        }}>
                            {rank}
                        </span>
                    );
                }
                return <span style={{ color: 'var(--text-muted)', paddingLeft: '8px' }}>{rank}</span>;
            },
        },
        { key: 'student', label: 'Estudiante' },
        { key: 'averageScore', label: 'Score promedio' },
        { key: 'sessions', label: 'Sesiones' },
        {
            key: 'trend', label: 'Tendencia',
            render: (val: unknown) => (
                <span style={{
                    color: val === 'up' ? 'var(--success-text)' : val === 'down' ? 'var(--danger-text)' : 'var(--text-muted)',
                    fontSize: '16px',
                }}>
                    {val === 'up' ? '↑' : val === 'down' ? '↓' : '→'}
                </span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Mi ranking"
                subtitle="Tu posición en los cursos de tu institución"
            />

            {/* Position highlight */}
            <div className="card-padded" style={{
                background: 'var(--brand-light)',
                border: '1px solid var(--brand-muted)',
                marginBottom: '24px',
                textAlign: 'center' as const,
            }}>
                <Trophy size={32} color="var(--brand)" style={{ marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 4px' }}>
                    Tu posición actual
                </p>
                <p style={{ fontSize: '48px', fontWeight: '700', color: 'var(--brand)', margin: '0 0 4px' }}>
                    —
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Completa sesiones para aparecer en el ranking
                </p>
            </div>

            <div className="card-padded" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Curso
                </label>
                <select className="input-field" style={{ maxWidth: '300px' }}>
                    <option value="">Todos los cursos</option>
                </select>
            </div>

            <DataTable
                columns={columns}
                data={[]}
                emptyMessage="Completa al menos una sesión para ver el ranking"
            />
        </div>
    );
}
