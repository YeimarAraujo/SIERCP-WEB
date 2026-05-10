'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { ManiquiService } from '@/services/firestore.service';
import { useAllDevices } from '@/hooks/use-realtime';
import { formatDate } from '@/lib/utils';
import type { ManiquiModel } from '@/models/device';
import { Cpu, Wifi, Activity, Battery, Settings2, Clock, Search, Plus, Radio, Server } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

const STATUS_STYLES: Record<string, { bg: string, color: string }> = {
    disponible: { bg: '#DCFCE7', color: '#166534' },
    en_uso: { bg: '#E0E7FF', color: '#1D4ED8' },
    mantenimiento: { bg: '#FEF3C7', color: '#92400E' },
    offline: { bg: '#F1F5F9', color: '#475569' },
};

export default function AdminDevicesPage() {
    const router = useRouter();
    const [manikins, setManikins] = useState<ManiquiModel[]>([]);
    const [loading, setLoading] = useState(true);
    const rtdbDevices = useAllDevices();

    useEffect(() => {
        ManiquiService.getAll().then(setManikins).finally(() => setLoading(false));
    }, []);

    const onlineCount = Object.keys(rtdbDevices).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Network Operations Center" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Infraestructura IoT" 
                    subtitle="Monitoreo en tiempo real de nodos SIERCP y telemetría clínica" 
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button onClick={() => router.push('/admin/devices/new')} style={{
                            padding: '10px 20px', borderRadius: 12, background: '#1800AD', color: '#FFFFFF',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                        }}>
                            <Plus size={16} /> Registrar Nodo
                        </button>
                    }
                />

                <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                    <div style={{ 
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: '16px 24px',
                        display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1
                    }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: onlineCount > 0 ? '#10B98110' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: onlineCount > 0 ? '#10B981' : '#94A3B8' }}>
                            <Radio size={22} className={onlineCount > 0 ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Estado de Red</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{onlineCount} Nodos Activos</div>
                        </div>
                    </div>
                    <div style={{ 
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: '16px 24px',
                        display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1
                    }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1800AD10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD' }}>
                            <Server size={22} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Capacidad Total</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{manikins.length} Maniquíes</div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{ height: 180, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : manikins.length === 0 ? (
                    <div style={{ 
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 32, 
                        padding: '80px 32px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        maxWidth: 600, margin: '0 auto'
                    }}>
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', margin: '0 auto 24px' }}>
                            <Cpu size={40} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Sin infraestructura detectada</h3>
                        <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                            No hay maniquíes vinculados a la organización. Comienza integrando tu primer nodo SIERCP-PRO para iniciar el monitoreo.
                        </p>
                        <button onClick={() => router.push('/admin/devices/new')} style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', 
                            background: '#1800AD', color: '#FFFFFF', borderRadius: 12, fontWeight: 700, 
                            border: 'none', cursor: 'pointer'
                        }}>
                            Configurar Nuevo Nodo
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
                        {manikins.map((m) => {
                            const live = rtdbDevices[m.uuid];
                            const style = STATUS_STYLES[m.status] || STATUS_STYLES.offline;
                            return (
                                <div key={m.id} style={{ 
                                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 20,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.borderColor = '#1800AD';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ 
                                                width: 52, height: 52, borderRadius: 16, background: live ? '#10B98110' : '#F8FAFC', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: live ? '#10B981' : '#1800AD', 
                                                border: '1px solid #F1F5F9' 
                                            }}>
                                                <Cpu size={26} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 16 }}>{m.name}</div>
                                                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', fontWeight: 600 }}>ID: {m.uuid.toUpperCase()}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                            <span style={{ 
                                                padding: '5px 12px', borderRadius: 20, fontSize: 10, fontWeight: 900,
                                                background: style.bg, color: style.color, textTransform: 'uppercase', letterSpacing: '0.05em'
                                            }}>
                                                {m.status.replace('_', ' ')}
                                            </span>
                                            {live && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 11, fontWeight: 800 }}>
                                                    <Wifi size={12} className="animate-pulse" /> LIVE STREAM
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {live ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                            <div style={{ background: '#F0FDF4', padding: '14px 10px', borderRadius: 16, textAlign: 'center', border: '1px solid #DCFCE7' }}>
                                                <div style={{ fontSize: 10, color: '#166534', fontWeight: 800, marginBottom: 4 }}>PROF.</div>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: '#166534' }}>{live.profundidadMm.toFixed(1)}<span style={{ fontSize: 10, marginLeft: 2 }}>mm</span></div>
                                            </div>
                                            <div style={{ background: '#EFF6FF', padding: '14px 10px', borderRadius: 16, textAlign: 'center', border: '1px solid #DBEAFE' }}>
                                                <div style={{ fontSize: 10, color: '#1D4ED8', fontWeight: 800, marginBottom: 4 }}>FREC.</div>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: '#1D4ED8' }}>{live.frecuenciaCpm.toFixed(0)}<span style={{ fontSize: 10, marginLeft: 2 }}>cpm</span></div>
                                            </div>
                                            <div style={{ background: '#F5F3FF', padding: '14px 10px', borderRadius: 16, textAlign: 'center', border: '1px solid #EDE9FE' }}>
                                                <div style={{ fontSize: 10, color: '#7E22CE', fontWeight: 800, marginBottom: 4 }}>BAT.</div>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: '#7E22CE' }}>{live.bateriaPct || 100}<span style={{ fontSize: 10, marginLeft: 2 }}>%</span></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Clock size={18} style={{ color: '#94A3B8' }} />
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Última Actividad</div>
                                                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                                                    {m.lastConnection ? formatDate(m.lastConnection) : 'Sin registros de enlace'}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                        <button style={{ 
                                            background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#64748B', 
                                            padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, 
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                                        }}>
                                            <Settings2 size={14} /> Mantenimiento
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.95); }
                }
            `}</style>
        </div>
    );
}
