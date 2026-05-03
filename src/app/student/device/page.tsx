'use client';

import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAllDevices } from '@/hooks/use-realtime';
import { MetricBar } from '@/components/charts/metric-bar';
import { formatRelativeTime } from '@/lib/utils';
import { AHA_MIN_DEPTH_MM, AHA_MAX_DEPTH_MM, AHA_MIN_RATE, AHA_MAX_RATE } from '@/lib/constants';

export default function StudentDevicePage() {
    const devices = useAllDevices();
    const entries = Object.values(devices);

    return (
        <div style={{ padding: 24 }}>
            <PageHeader title="Mi dispositivo" subtitle="Estado del maniquí" />

            {entries.length === 0 ? (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    padding: 40,
                    textAlign: 'center',
                }}>
                    <p style={{ color: '#8892A4' }}>No hay dispositivos detectados</p>
                </div>
            ) : (
                entries.map((device) => (
                    <div key={device.macAddress} style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E4F0',
                        borderRadius: 12,
                        padding: 20,
                        marginBottom: 12,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#0B1C30', fontFamily: 'monospace' }}>
                                    {device.macAddress}
                                </p>
                                <p style={{ fontSize: 12, color: device.isActive ? '#10B981' : '#8892A4' }}>
                                    {device.isActive ? 'Activo' : `Inactivo — ${formatRelativeTime(new Date(device.timestamp))}`}
                                </p>
                            </div>
                            <span style={{
                                fontSize: 11, fontWeight: 500,
                                padding: '2px 10px', borderRadius: 999,
                                background: device.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: device.isActive ? '#10B981' : '#EF4444',
                            }}>
                                {device.isActive ? 'En línea' : 'Offline'}
                            </span>
                        </div>

                        {device.isActive && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                                    {[
                                        { label: 'Profundidad', value: `${device.profundidadMm.toFixed(1)} mm`, ok: device.profundidadMm >= AHA_MIN_DEPTH_MM && device.profundidadMm <= AHA_MAX_DEPTH_MM },
                                        { label: 'Frecuencia', value: `${device.frecuenciaCpm.toFixed(0)} /min`, ok: device.frecuenciaCpm >= AHA_MIN_RATE && device.frecuenciaCpm <= AHA_MAX_RATE },
                                        { label: 'Fuerza', value: `${device.fuerzaKg.toFixed(1)} kg`, ok: undefined },
                                        { label: 'Compresiones', value: String(device.compresiones), ok: undefined },
                                    ].map(({ label, value, ok }) => (
                                        <div key={label} style={{ background: '#F0F1FA', borderRadius: 8, padding: '10px 12px' }}>
                                            <p style={{ fontSize: 11, color: '#8892A4', margin: '0 0 4px' }}>{label}</p>
                                            <p style={{
                                                fontSize: 13, fontWeight: 600, margin: 0,
                                                color: ok === true ? '#10B981' : ok === false ? '#EF4444' : '#0B1C30',
                                            }}>
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <MetricBar label="Calidad general" value={device.calidadPct} />
                                <MetricBar label="Recoil" value={device.recoilPct} />
                            </>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
