'use client';

import { Trophy, TrendingUp, TrendingDown, Minus, Search, Target, Award, Star } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/ui/data-table';

export default function StudentRankingPage() {
    const podiumStyles = [
        { bg: '#FFD700', color: '#5C4300', icon: Star },
        { bg: '#C0C0C0', color: '#3D3D3D', icon: Trophy },
        { bg: '#CD7F32', color: '#3D2100', icon: Award },
    ];

    const columns = [
        {
            key: 'rank', label: 'Posición',
            render: (_: unknown, row: any) => {
                const rank = Number(row.rank);
                const style = podiumStyles[rank - 1];
                if (rank <= 3 && style) {
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
                            <style.icon size={16} style={{ color: style.bg }} />
                        </div>
                    );
                }
                return (
                    <div style={{ paddingLeft: '8px', fontWeight: 700, color: '#64748B' }}>
                        {rank}
                    </div>
                );
            },
        },
        { 
            key: 'student', 
            label: 'Estudiante',
            render: (val: any) => (
                <div style={{ fontWeight: 800, color: '#0F172A' }}>{val}</div>
            )
        },
        { 
            key: 'averageScore', 
            label: 'Puntaje AHA',
            render: (val: any) => (
                <div style={{ fontWeight: 900, color: '#1800AD', fontSize: 16 }}>{val}%</div>
            )
        },
        { 
            key: 'sessions', 
            label: 'Sesiones',
            render: (val: any) => (
                <div style={{ color: '#64748B', fontWeight: 600 }}>{val} prácticas</div>
            )
        },
        {
            key: 'trend', label: 'Tendencia',
            render: (val: unknown) => {
                if (val === 'up') return <TrendingUp size={18} style={{ color: '#10B981' }} />;
                if (val === 'down') return <TrendingDown size={18} style={{ color: '#EF4444' }} />;
                return <Minus size={18} style={{ color: '#94A3B8' }} />;
            },
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Ranking Institucional" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Cuadro de Honor" 
                    subtitle="Liderazgo académico basado en desempeño clínico real" 
                    parentTitle="Estudiante"
                    parentHref="/student/home"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                    <div style={{
                        background: '#1800AD', borderRadius: 24, padding: 32, color: '#FFFFFF',
                        display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)'
                    }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>Tu Posición Actual</div>
                            <div style={{ fontSize: 32, fontWeight: 900 }}>No Clasificado</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Completa sesiones para entrar al top</div>
                        </div>
                    </div>

                    <div style={{
                        background: '#FFFFFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0',
                        display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                            <Target size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Meta de Excelencia</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>95% de Calidad</div>
                            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Sigue practicando para alcanzar el top 3</div>
                        </div>
                    </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Filtrar por estudiante..."
                                style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#F8FAFC' }}
                            />
                        </div>
                        <select style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: 13, fontWeight: 700, color: '#475569', outline: 'none' }}>
                            <option value="">Todos los cursos</option>
                        </select>
                    </div>

                    <DataTable
                        columns={columns}
                        data={[]}
                        emptyMessage="Completa al menos una sesión para ver el ranking global de tu institución."
                    />
                </div>
            </div>
        </div>
    );
}
