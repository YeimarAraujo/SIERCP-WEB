'use client';

import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { useAllDevices } from '@/hooks/use-realtime';
import { MetricBar } from '@/components/charts/metric-bar';
import { formatRelativeTime } from '@/lib/utils';
import { AHA_MIN_DEPTH_MM, AHA_MAX_DEPTH_MM, AHA_MIN_RATE, AHA_MAX_RATE } from '@/lib/constants';
import { Cpu, Wifi, Battery, Activity, ShieldCheck, Zap, Radio, RefreshCw, Signal } from 'lucide-react';

export default function StudentDevicePage() {
    const devices = useAllDevices();
    const entries = Object.values(devices);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Mi Dispositivo" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Enlace de Telemetría" 
                    subtitle="Monitoreo en tiempo real de tu maniquí SIERCP vinculado" 
                    parentTitle="Estudiante"
                    parentHref="/student/home"
                />

                {entries.length === 0 ? (
                    <div style={{ 
                        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 32, 
                        padding: '80px 32px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        maxWidth: 600, margin: '0 auto'
                    }}>
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border-strong)', margin: '0 auto 24px' }}>
                            <Radio size={40} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', marginBottom: 12 }}>Sin conexión detectada</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                            Enciende tu maniquí y asegúrate de tener el Bluetooth activo en tu aplicación móvil para iniciar la transmisión de datos clínicos.
                        </p>
                        <button style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', 
                            background: 'var(--brand)', color: 'var(--text-on-brand)', borderRadius: 12, fontWeight: 700, 
                            border: 'none', cursor: 'pointer'
                        }}>
                            <RefreshCw size={18} /> Escanear Dispositivos
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 32 }}>
                        {entries.map((device) => (
                            <div key={device.macAddress} style={{ 
                                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 28, padding: 32,
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
                            }}>
                                {/* Connection Status Banner */}
                                <div style={{ 
                                    position: 'absolute', top: 0, right: 0, padding: '12px 24px', 
                                    background: device.isActive ? '#DCFCE7' : 'var(--muted)',
                                    color: device.isActive ? '#166534' : 'var(--text-secondary)',
                                    fontSize: 11, fontWeight: 900, borderRadius: '0 0 0 20px',
                                    display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.05em'
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: device.isActive ? '#10B981' : 'var(--text-muted)', animation: device.isActive ? 'pulse 2s infinite' : 'none' }} />
                                    {device.isActive ? 'CONECTADO VÍA CLOUD' : 'DESCONECTADO'}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-on-brand)' }}>
                                        <Cpu size={32} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--foreground)' }}>Maniquí SIERCP-PRO</h3>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{device.macAddress}</code>
                                            <span style={{ color: 'var(--border-strong)' }}>•</span>
                                            {device.isActive ? 'Recibiendo paquetes...' : `Visto hace ${formatRelativeTime(new Date(device.timestamp))}`}
                                        </div>
                                    </div>
                                </div>

                                {device.isActive && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40 }}>
                                        <div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                                                <LiveMetricCard 
                                                    icon={Activity} 
                                                    label="PROFUNDIDAD" 
                                                    value={device.profundidadMm.toFixed(1)} 
                                                    unit="mm" 
                                                    status={device.profundidadMm >= AHA_MIN_DEPTH_MM && device.profundidadMm <= AHA_MAX_DEPTH_MM ? 'success' : 'warning'} 
                                                />
                                                <LiveMetricCard 
                                                    icon={Zap} 
                                                    label="FRECUENCIA" 
                                                    value={device.frecuenciaCpm.toFixed(0)} 
                                                    unit="cpm" 
                                                    status={device.frecuenciaCpm >= AHA_MIN_RATE && device.frecuenciaCpm <= AHA_MAX_RATE ? 'success' : 'warning'} 
                                                />
                                                <LiveMetricCard 
                                                    icon={Signal} 
                                                    label="FUERZA" 
                                                    value={device.fuerzaKg.toFixed(1)} 
                                                    unit="kg" 
                                                />
                                                <LiveMetricCard 
                                                    icon={Battery} 
                                                    label="BATERÍA" 
                                                    value={device.bateriaPct || 100} 
                                                    unit="%" 
                                                />
                                            </div>

                                            <div style={{ background: 'var(--muted)', borderRadius: 24, padding: 24, border: '1px solid var(--muted)' }}>
                                                <h4 style={{ margin: '0 0 20px 0', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MÉTRICAS DE CALIDAD AHA</h4>
                                                <div style={{ display: 'grid', gap: 20 }}>
                                                    <MetricBar label="Calidad General de la Sesión" value={device.calidadPct} color="#10B981" />
                                                    <MetricBar label="Técnica de Recoil (Expansión)" value={device.recoilPct} color="var(--brand)" />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--foreground)', borderRadius: 24, padding: 32, color: 'var(--text-on-brand)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.1em' }}>SESIÓN ACTUAL</div>
                                            <div style={{ fontSize: 64, fontWeight: 900, color: 'var(--text-on-brand)', lineHeight: 1 }}>{device.compresiones}</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-accent)', marginTop: 8 }}>COMPRESIONES</div>
                                            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                                                <ShieldCheck size={16} style={{ color: '#10B981' }} /> Estándar AHA 2025 Activo
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}

function LiveMetricCard({ icon: Icon, label, value, unit, status }: any) {
    const color = status === 'success' ? '#10B981' : status === 'warning' ? '#F59E0B' : 'var(--foreground)';
    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                    <Icon size={18} />
                </div>
                {status && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                )}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>
                {value}<span style={{ fontSize: 12, marginLeft: 2, fontWeight: 700, color: 'var(--text-muted)' }}>{unit}</span>
            </div>
        </div>
    );
}
