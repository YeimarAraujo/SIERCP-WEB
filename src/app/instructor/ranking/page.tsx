'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Trophy } from 'lucide-react';

export default function InstructorRankingPage() {
    const podiumStyles = [
        { bg: '#FFD700', color: '#5C4300', label: '1' },
        { bg: '#C0C0C0', color: '#3D3D3D', label: '2' },
        { bg: '#CD7F32', color: '#3D2100', label: '3' },
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
        { key: 'course', label: 'Curso' },
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
                title="Ranking de estudiantes"
                subtitle="Posiciones por curso según score AHA"
                actions={
                    <Trophy size={28} color="var(--brand)" />
                }
            />

            <div className="card-padded" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Filtrar por curso
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
