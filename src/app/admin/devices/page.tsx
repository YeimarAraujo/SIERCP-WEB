'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { ManiquiService } from '@/services/firestore.service';
import { useAllDevices } from '@/hooks/use-realtime';
import { formatDate } from '@/lib/utils';
import type { ManiquiModel } from '@/models/device';

const STATUS_COLORS: Record<string, string> = {
    disponible: 'bg-green-100 text-green-700',
    en_uso: 'bg-blue-100 text-blue-700',
    mantenimiento: 'bg-yellow-100 text-yellow-700',
    offline: 'bg-red-100 text-red-700',
};

export default function AdminDevicesPage() {
    const [manikins, setManikins] = useState<ManiquiModel[]>([]);
    const [loading, setLoading] = useState(true);
    const rtdbDevices = useAllDevices();

    useEffect(() => {
        ManiquiService.getAll().then(setManikins).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Gestión de dispositivos" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

                <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${Object.keys(rtdbDevices).length > 0 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    <p className="text-sm">
                        <span className="font-medium">{Object.keys(rtdbDevices).length}</span>
                        <span className="text-muted-foreground"> dispositivo(s) emitiendo telemetría ahora mismo</span>
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
                    </div>
                ) : manikins.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-12 text-center">
                        <p className="text-sm text-muted-foreground">No hay dispositivos registrados.</p>
                        <p className="text-xs text-muted-foreground mt-1">Registra un maniquí con el UUID (MAC address) del ESP-32.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {manikins.map((m) => {
                            const live = rtdbDevices[m.uuid];
                            return (
                                <div key={m.id} className="rounded-lg border border-border bg-card p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-sm">{m.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{m.uuid}</p>
                                            {m.lastConnection && (
                                                <p className="text-xs text-muted-foreground">
                                                    Última conexión: {formatDate(m.lastConnection)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[m.status] ?? ''}`}>
                                                {m.status.replace('_', ' ')}
                                            </span>
                                            {live && (
                                                <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-green-100 text-green-700">
                                                    ● En línea
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {live && (
                                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                            <div className="rounded bg-muted px-2 py-1">
                                                <span className="text-muted-foreground">Profundidad </span>
                                                <span className="font-medium">{live.profundidadMm.toFixed(1)}mm</span>
                                            </div>
                                            <div className="rounded bg-muted px-2 py-1">
                                                <span className="text-muted-foreground">Frecuencia </span>
                                                <span className="font-medium">{live.frecuenciaCpm.toFixed(0)}/min</span>
                                            </div>
                                            <div className="rounded bg-muted px-2 py-1">
                                                <span className="text-muted-foreground">Calidad </span>
                                                <span className="font-medium">{live.calidadPct.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
