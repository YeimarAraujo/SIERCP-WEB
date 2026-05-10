'use client';

import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { Award, Download, ShieldCheck, Calendar, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SessionService, CourseService } from '@/services/firestore.service';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import type { SessionModel } from '@/models/session';

export default function StudentCertificatesPage() {
    const { user } = useAuth();
    const [certificates, setCertificates] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchCertificates = async () => {
            try {
                setLoading(true);
                // Usamos la misma lógica robusta que en el Home
                const userSessions = await SessionService.getByStudent(user.uid, 100);

                const uniqueSessions = Array.from(new Map(userSessions.map(s => [s.id, s])).values())
                    .filter(s => {
                        const score = s.metrics?.qualityScore || (s.metrics as any)?.score || 0;
                        return score >= 85;
                    })
                    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

                setCertificates(uniqueSessions);
            } catch (error) {
                console.error('Error fetching certificates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, [user]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Certificaciones" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Logros Académicos" 
                    subtitle="Certificados oficiales emitidos por completar satisfactoriamente los estándares AHA." 
                    parentTitle="Estudiante"
                    parentHref="/student/home"
                />

                {certificates.length === 0 && !loading ? (
                    <div style={{ 
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 32, 
                        padding: '80px 32px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        maxWidth: 600, margin: '0 auto'
                    }}>
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C', margin: '0 auto 24px' }}>
                            <Award size={40} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Sin certificados aún</h3>
                        <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                            Para obtener una certificación oficial, debes completar una sesión de evaluación con un puntaje de calidad superior al 85%.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
                        {certificates.map((cert) => (
                            <CertificateCard key={cert.id} session={cert} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CertificateCard({ session }: { session: SessionModel }) {
    return (
        <div style={{ 
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 28, padding: 24,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(24, 0, 173, 0.03)' }} />
            
            <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD' }}>
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Certificación RCP</h4>
                    <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{session.scenarioTitle || 'Evaluación General'}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>PUNTAJE AHA</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981' }}>{session.metrics?.qualityScore || (session.metrics as any)?.score || 0}%</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>EMITIDO EL</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{session.startedAt.toLocaleDateString()}</div>
                </div>
            </div>

            <div style={{ height: 1, background: '#F1F5F9', marginBottom: 20 }} />

            <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => toast.error('La generación de PDF estará disponible próximamente')} style={{ 
                    flex: 2, padding: '12px', borderRadius: 12, background: '#1800AD', color: '#FFFFFF', 
                    fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', gap: 8 
                }}>
                    <Download size={16} /> Descargar PDF
                </button>
                <button onClick={() => toast.error('La vista pública del certificado estará disponible próximamente')} style={{ 
                    flex: 1, padding: '12px', borderRadius: 12, background: '#F8FAFC', color: '#64748B', 
                    fontSize: 13, fontWeight: 700, border: '1px solid #E2E8F0', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                    <ExternalLink size={16} />
                </button>
            </div>
        </div>
    );
}
