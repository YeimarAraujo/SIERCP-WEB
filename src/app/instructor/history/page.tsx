'use client';

import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';

export default function InstructorHistoryPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Historial del grupo" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <PageHeader title="Historial del grupo" subtitle="Consulta el rendimiento de tus alumnos" />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#F0F1FA', color: '#4A5568', fontSize: 12, textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Alumno</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Fecha</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Score</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Curso</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#8892A4' }}>
                                    No hay sesiones registradas aún
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
