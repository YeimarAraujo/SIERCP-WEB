'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { CheckSquare, FileText, Plus, Search, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EvaluationService } from '@/services/firestore.service';

export default function InstructorEvaluationsPage() {
    const { user } = useAuth();
    const [rubrics, setRubrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchRubrics = async () => {
            try {
                setLoading(true);
                const data = await EvaluationService.getRubrics(user.uid);
                setRubrics(data);
            } finally {
                setLoading(false);
            }
        };
        fetchRubrics();
    }, [user]);

    const filteredRubrics = rubrics.filter(r =>
        searchTerm === '' ||
        (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.type || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Evaluaciones" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Evaluaciones"
                    subtitle="Gestión de rúbricas, exámenes teóricos y listas de chequeo AHA"
                    parentTitle="Instructor"
                    parentHref="/instructor/dashboard"
                    actions={
                        <button style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={18} /> Crear Rúbrica
                        </button>
                    }
                />

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {filteredRubrics.map((r) => (
                            <EvalCard key={r.id} title={r.title} type={r.type} items={r.items} color={r.color || 'var(--brand)'} />
                        ))}
                    </div>
                )}

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, marginTop: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--foreground)', margin: 0 }}>Evaluaciones Pendientes por Calificar</h3>
                        <div style={{ position: 'relative', width: 250 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Buscar alumno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: 16 }}>
                            No hay evaluaciones pendientes por calificar en este momento.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EvalCard({ title, type, items, color }: any) {
    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                    <CheckSquare size={22} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{type}</div>
            </div>
            <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--foreground)' }}>{title}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{items} ítems de evaluación</p>
            </div>
            <button style={{ padding: '10px', borderRadius: 10, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Editar Plantilla</button>
        </div>
    );
}
