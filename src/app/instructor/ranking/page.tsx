'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { Trophy, TrendingUp, Target, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { RankingService } from '@/services/firestore.service';

export default function InstructorRankingPage() {
    const { user } = useAuth();
    const [topStudents, setTopStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchRanking = async () => {
            try {
                setLoading(true);
                const data = await RankingService.getTopStudents(user.uid);
                setTopStudents(data);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, [user]);

    const bestStudent = topStudents[0];
    const avgOverall = topStudents.length > 0 
        ? topStudents.reduce((acc, s) => acc + (s.avgScore || 0), 0) / topStudents.length 
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Ranking Institucional" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Cuadro de Honor" 
                    subtitle="Liderazgo académico y competitividad clínica basada en desempeño real"
                    parentTitle="Instructor"
                    parentHref="/instructor/dashboard"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 32 }}>
                    <RankCard title="Mejor Alumno" name={bestStudent?.studentName || '---'} score={`${(bestStudent?.avgScore || 0).toFixed(1)}%`} icon={Trophy} color="#F59E0B" />
                    <RankCard title="Promedio General" name="Meta Institucional" score={`${avgOverall.toFixed(1)}%`} icon={TrendingUp} color="#10B981" />
                    <RankCard title="Alumnos Listados" name="Filtro de Excelencia" score={topStudents.length} icon={Target} color="var(--brand)" />
                </div>

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--foreground)', marginBottom: 24 }}>Top Alumnos SIERCP</h3>
                    
                    {loading ? (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)', margin: '0 auto' }} />
                        </div>
                    ) : topStudents.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay datos de ranking disponibles.</div>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {topStudents.map((s, i) => (
                                <div key={s.studentId} style={{ padding: '16px 24px', borderRadius: 16, background: i < 3 ? 'var(--muted)' : 'transparent', border: '1px solid var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <div style={{ 
                                            width: 32, height: 32, borderRadius: 10, background: i === 0 ? '#F59E0B' : i === 1 ? 'var(--text-muted)' : i === 2 ? '#B45309' : 'var(--muted)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: i < 3 ? 'var(--text-on-brand)' : 'var(--text-secondary)', fontWeight: 900, fontSize: 13
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 15 }}>{s.studentName}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.courseName}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand)' }}>{(s.avgScore || 0).toFixed(1)}%</div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Puntaje AHA</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RankCard({ title, name, score, icon: Icon, color }: any) {
    return (
        <div style={{ background: 'var(--card)', padding: 24, borderRadius: 24, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                <Icon size={28} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: color }}>{score}</div>
            </div>
        </div>
    );
}
