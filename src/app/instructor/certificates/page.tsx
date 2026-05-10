'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { Award, Search, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { CourseService, SessionService } from '@/services/firestore.service';

interface CertificateGroup {
    title: string;
    code: string;
    count: number;
    students: string[];
}

export default function InstructorCertificatesPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<CertificateGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const courses = await CourseService.getByInstructor(user.uid);
                const allSessions = (await Promise.all(
                    courses.map(c => SessionService.getByCourse(c.id))
                )).flat();

                const certified = allSessions.filter(s => (s.metrics?.qualityScore ?? 0) >= 85);
                const map = new Map<string, CertificateGroup>();

                for (const s of certified) {
                    const key = s.scenarioTitle || s.courseTitle || 'General';
                    if (!map.has(key)) {
                        map.set(key, { title: key, code: key.slice(0, 7).toUpperCase(), count: 0, students: [] });
                    }
                    const group = map.get(key)!;
                    group.count++;
                    if (s.studentName && !group.students.includes(s.studentName)) {
                        group.students.push(s.studentName);
                    }
                }

                setGroups(Array.from(map.values()));
            } catch (e) {
                console.error('Error fetching certificates:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const filtered = groups.filter(g =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Certificaciones" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Control de Certificados"
                    subtitle={`Validación y emisión de credenciales — ${groups.length} tipos de certificación`}
                    parentTitle="Instructor"
                    parentHref="/instructor/dashboard"
                />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ maxWidth: 400, marginBottom: 24, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filtrar certificaciones..."
                            style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#F8FAFC' }}
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 48 }}>
                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#1800AD' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 48 }}>
                            <Award size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Sin certificaciones</h3>
                            <p style={{ color: '#64748B', fontSize: 14 }}>
                                Aún no hay estudiantes que hayan alcanzado el 85% de calidad en sus simulaciones.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                            {filtered.map(g => (
                                <div key={g.code} style={{ padding: 24, borderRadius: 20, background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                            <CheckCircle size={22} />
                                        </div>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Código: {g.code}</div>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{g.title}</h4>
                                        <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>{g.count} certificaciones emitidas</p>
                                    </div>
                                    <button style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#1800AD', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <FileText size={16} /> Ver Listado ({g.count})
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
