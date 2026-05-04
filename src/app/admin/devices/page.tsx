'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { ManiquiService } from '@/services/firestore.service';
import { useAllDevices } from '@/hooks/use-realtime';
import { formatDate } from '@/lib/utils';
import type { ManiquiModel } from '@/models/device';
import { Cpu, Wifi, Activity, Battery, Settings2 } from 'lucide-react';

const STATUS_STYLES: Record<string, { bg: string, color: string }> = {
    disponible: { bg: '#DCFCE7', color: '#166534' },
    en_uso: { bg: '#E0E7FF', color: '#1D4ED8' },
    mantenimiento: { bg: '#FEF3C7', color: '#92400E' },
    offline: { bg: '#F1F5F9', color: '#475569' },
};

export default function AdminDevicesPage() {
    const [manikins, setManikins] = useState<ManiquiModel[]>([]);
    const [loading, setLoading] = useState(true);
    const rtdbDevices = useAllDevices();

    useEffect(() => {
        ManiquiService.getAll().then(setManikins).finally(() => setLoading(false));
    }, []);

    const onlineCount = Object.keys(rtdbDevices).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Gestión de dispositivos" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <PageHeader
                        title="Gestión de dispositivos"
                        subtitle="Supervisa el hardware y la telemetría IoT"
                    />
                    <div style={{ 
                        background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 12, padding: '10px 16px',
                        display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: onlineCount > 0 ? '#10B981' : '#94A3B8', animation: onlineCount > 0 ? 'pulse 2s infinite' : 'none' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                            {onlineCount} dispositivo(s) emitiendo telemetría
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{ height: 100, background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 12, animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : manikins.length === 0 ? (
                    <div style={{ background: '#FFFFFF', border: '2px dashed #E2E4F0', borderRadius: 16, padding: 64, textAlign: 'center' }}>
                        <Cpu size={48} style={{ color: '#E2E4F0', marginBottom: 16 }} />
                        <p style={{ color: '#64748B', fontSize: 14 }}>No hay dispositivos registrados.</p>
                        <button style={{ marginTop: 16, background: '#1800AD', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Registrar primer maniquí
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
                        {manikins.map((m) => {
                            const live = rtdbDevices[m.uuid];
                            const style = STATUS_STYLES[m.status] || STATUS_STYLES.offline;
                            return (
                                <div key={m.id} style={{ 
                                    background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 16, padding: 20,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD', border: '1px solid #F1F5F9' }}>
                                                <Cpu size={22} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>{m.name}</div>
                                                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>MAC: {m.uuid}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                                                background: style.bg, color: style.color, textTransform: 'uppercase'
                                            }}>
                                                {m.status.replace('_', ' ')}
                                            </span>
                                            {live && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                                                    <Wifi size={12} /> EN LÍNEA
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {live ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                            <div style={{ background: '#F0FDF4', padding: '10px 8px', borderRadius: 12, textAlign: 'center' }}>
                                                <div style={{ fontSize: 10, color: '#166534', fontWeight: 600 }}>PROF.</div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>{live.profundidadMm.toFixed(1)}</div>
                                            </div>
                                            <div style={{ background: '#EFF6FF', padding: '10px 8px', borderRadius: 12, textAlign: 'center' }}>
                                                <div style={{ fontSize: 10, color: '#1D4ED8', fontWeight: 600 }}>FREC.</div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: '#1D4ED8' }}>{live.frecuenciaCpm.toFixed(0)}</div>
                                            </div>
                                            <div style={{ background: '#F5F3FF', padding: '10px 8px', borderRadius: 12, textAlign: 'center' }}>
                                                <div style={{ fontSize: 10, color: '#7E22CE', fontWeight: 600 }}>BATERÍA</div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: '#7E22CE' }}>{live.bateriaPct || 100}%</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Clock size={16} style={{ color: '#94A3B8' }} />
                                            <span style={{ fontSize: 12, color: '#64748B' }}>
                                                Última actividad: {m.lastConnection ? formatDate(m.lastConnection) : 'Nunca'}
                                            </span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                                        <button style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                            <Settings2 size={14} /> Configurar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
