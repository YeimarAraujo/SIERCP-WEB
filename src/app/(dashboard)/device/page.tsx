'use client';

import { Header } from '@/components/layout/header';
import { MetricBar } from '@/components/charts/metric-bar';
import { useAllDevices } from '@/hooks/use-realtime';
import { formatRelativeTime } from '@/lib/utils';
import { AHA_MIN_DEPTH_MM, AHA_MAX_DEPTH_MM, AHA_MIN_RATE, AHA_MAX_RATE } from '@/lib/constants';

function statusColor(active: boolean) {
    return active ? 'bg-aha-excellent' : 'bg-aha-fail';
}

export default function DevicePage() {
    const devices = useAllDevices();
    const entries = Object.values(devices);

    return (
        <div className="flex flex-col h-full">
            <Header title="Estado de maniquíes" />
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">

                {entries.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            No hay dispositivos detectados. Verifica que el ESP-32 esté encendido y conectado al Wi-Fi.
                        </p>
                    </div>
                ) : (
                    entries.map((device) => (
                        <div key={device.macAddress} className="rounded-lg border border-border bg-card p-5 space-y-4">

                            {/* Header row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`h-2.5 w-2.5 rounded-full ${statusColor(device.isActive)}`} />
                                    <div>
                                        <p className="text-sm font-semibold font-mono">{device.macAddress}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {device.isActive
                                                ? 'Activo — datos en tiempo real'
                                                : `Inactivo — último dato ${formatRelativeTime(new Date(device.timestamp))}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <span className={`rounded-full px-2 py-0.5 font-medium ${device.sensorOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Sensor {device.sensorOk ? 'OK' : 'Error'}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 font-medium ${device.calibrado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {device.calibrado ? 'Calibrado' : 'Sin calibrar'}
                                    </span>
                                </div>
                            </div>

                            {/* Live metrics */}
                            {device.isActive && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    {[
                                        { label: 'Profundidad', value: `${device.profundidadMm.toFixed(1)} mm`, ok: device.profundidadMm >= AHA_MIN_DEPTH_MM && device.profundidadMm <= AHA_MAX_DEPTH_MM },
                                        { label: 'Frecuencia', value: `${device.frecuenciaCpm.toFixed(0)} /min`, ok: device.frecuenciaCpm >= AHA_MIN_RATE && device.frecuenciaCpm <= AHA_MAX_RATE },
                                        { label: 'Fuerza', value: `${device.fuerzaKg.toFixed(1)} kg`, ok: undefined },
                                        { label: 'Compresiones', value: String(device.compresiones), ok: undefined },
                                    ].map(({ label, value, ok }) => (
                                        <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                            <p className={`font-semibold tabular-nums mt-0.5 ${ok === true ? 'text-green-600' : ok === false ? 'text-red-500' : ''}`}>
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quality bars */}
                            {device.isActive && (
                                <div className="space-y-2">
                                    <MetricBar label="Calidad general" value={device.calidadPct} />
                                    <MetricBar label="Recoil" value={device.recoilPct} />
                                </div>
                            )}

                        </div>
                    ))
                )}

            </div>
        </div>
    );
}