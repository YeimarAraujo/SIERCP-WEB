'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/hooks/use-auth';
import { SessionService, CourseService } from '@/services/firestore.service';
import { formatDate } from '@/lib/utils';
import { Clock, Search, Filter, Calendar, BookOpen, User } from 'lucide-react';

export default function InstructorHistoryPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                setLoading(true);
                const courses = await CourseService.getByInstructor(user.uid);
                const sessionPromises = courses.map(async (c) => {
                    const sess = await SessionService.getByCourse(c.id);
                    return sess.map(s => ({ ...s, courseName: c.title }));
                });
                const all = (await Promise.all(sessionPromises)).flat();
                setSessions(all.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const columns = [
        {
            key: 'studentName',
            label: 'Estudiante',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700, fontSize: 11 }}>{String(val || '').charAt(0)}</div>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
            )
        },
        { key: 'courseName', label: 'Curso', render: (val: any) => <div style={{ fontSize: 13, color: '#64748B' }}><BookOpen size={12} style={{ marginRight: 4 }} />{val}</div> },
        { key: 'scenarioTitle', label: 'Escenario', render: (val: any) => <div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div> },
        {
            key: 'qualityScore',
            label: 'Calidad',
            render: (_: any, row: any) => {
                const score = row.metrics?.qualityScore ?? 0;
                return <div style={{ fontWeight: 800, color: score >= 85 ? '#10B981' : '#F59E0B' }}>{score}%</div>;
            }
        },
        { key: 'startedAt', label: 'Fecha', render: (val: any) => <div style={{ fontSize: 12, color: '#94A3B8' }}>{formatDate(val)}</div> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Historial de Sesiones" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Historial de Sesiones"
                    subtitle="Registro histórico de todas las sesiones de práctica supervisadas"
                    parentTitle="Instructor"
                    parentHref="/instructor/dashboard"
                />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Buscar por estudiante, curso o escenario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                        />
                    </div>

                    <DataTable
                        columns={columns}
                        data={sessions.filter(s =>
                            s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.scenarioTitle.toLowerCase().includes(searchTerm.toLowerCase())
                        )}
                        loading={loading}
                        emptyMessage="No hay registros históricos en la bitácora."
                    />
                </div>
            </div>
        </div>
    );
}
