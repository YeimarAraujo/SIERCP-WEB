'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Search, Target, Award, Star } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/hooks/use-auth';
import { UserService } from '@/services/firestore.service';
import { getFullName } from '@/models/user';
import { ROLE_STUDENT } from '@/shared/lib/constants';
import type { UserModel } from '@/models/user';

interface RankingEntry {
    rank: number;
    student: string;
    averageScore: number;
    sessions: number;
    trend: string;
    uid: string;
}

export default function StudentRankingPage() {
    const { user } = useAuth();
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        UserService.getAll()
            .then(users => {
                const sameInstitution = users.filter(
                    u => u.role === ROLE_STUDENT && u.institutionId === user.institutionId
                );
                const ranked = sameInstitution
                    .sort((a, b) => (b.stats?.averageScore ?? 0) - (a.stats?.averageScore ?? 0))
                    .map((u, i) => ({
                        rank: i + 1,
                        student: getFullName(u),
                        averageScore: Math.round(u.stats?.averageScore ?? 0),
                        sessions: u.stats?.totalSessions ?? 0,
                        uid: u.uid,
                        trend: (u.stats?.averageScore ?? 0) >= 85 ? 'up' : (u.stats?.averageScore ?? 0) >= 70 ? 'minus' : 'down',
                    }));
                setRanking(ranked);
            })
            .finally(() => setLoading(false));
    }, [user]);

    const userRank = ranking.find(e => e.uid === user?.uid);
    const filtered = ranking.filter(e =>
        e.student.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const podiumStyles = [
        { bg: '#FFD700', color: '#5C4300', icon: Star },
        { bg: '#C0C0C0', color: '#3D3D3D', icon: Trophy },
        { bg: '#CD7F32', color: '#3D2100', icon: Award },
    ];

    const columns = [
        {
            key: 'rank', label: 'Posición',
            render: (_: unknown, row: RankingEntry) => {
                const rank = Number(row.rank);
                const style = podiumStyles[rank - 1];
                if (rank <= 3 && style) {
                    const Icon = style.icon;
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '32px', height: '32px', borderRadius: '10px',
                                background: style.bg, color: style.color,
                                fontSize: '14px', fontWeight: '900',
                                boxShadow: `0 4px 10px ${style.bg}40`
                            }}>
                                {rank}
                            </span>
                            <Icon size={16} style={{ color: style.bg }} />
                        </div>
                    );
                }
                return (
                    <div style={{ paddingLeft: '8px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {rank}
                    </div>
                );
            },
        },
        {
            key: 'student',
            label: 'Estudiante',
            render: (val: any, row: RankingEntry) => (
                <div style={{
                    fontWeight: 800, color: 'var(--foreground)',
                    ...(row.uid === user?.uid ? { color: 'var(--brand)' } : {}),
                }}>
                    {val} {row.uid === user?.uid ? '(Tú)' : ''}
                </div>
            )
        },
        {
            key: 'averageScore',
            label: 'Puntaje AHA',
            render: (val: any) => (
                <div style={{ fontWeight: 900, color: 'var(--brand)', fontSize: 16 }}>{val}%</div>
            )
        },
        {
            key: 'sessions',
            label: 'Sesiones',
            render: (val: any) => (
                <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{val} prácticas</div>
            )
        },
        {
            key: 'trend', label: 'Tendencia',
            render: (val: unknown) => {
                if (val === 'up') return <TrendingUp size={18} style={{ color: '#10B981' }} />;
                if (val === 'down') return <TrendingDown size={18} style={{ color: '#EF4444' }} />;
                return <Minus size={18} style={{ color: 'var(--text-muted)' }} />;
            },
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Ranking Institucional" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Cuadro de Honor"
                    subtitle="Liderazgo académico basado en desempeño clínico real"
                    parentTitle="Inicio"
                    parentHref="/student/home"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                    <div style={{
                        background: 'var(--brand)', borderRadius: 24, padding: 32, color: 'var(--text-on-brand)',
                        display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)'
                    }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>Tu Posición Actual</div>
                            <div style={{ fontSize: 32, fontWeight: 900 }}>
                                {userRank ? `#${userRank.rank} — ${userRank.averageScore}%` : 'No Clasificado'}
                            </div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                                {userRank ? `${ranking.length} estudiantes en tu institución` : 'Completa sesiones para entrar al top'}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--card)', borderRadius: 24, padding: 32, border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                            <Target size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Meta de Excelencia</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--foreground)' }}>95% de Calidad</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Sigue practicando para alcanzar el top 3</div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filtrar por estudiante..."
                                style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--muted)' }}
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        emptyMessage="Completa al menos una sesión para ver el ranking global de tu institución."
                    />
                </div>
            </div>
        </div>
    );
}
