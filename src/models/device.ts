export interface DeviceInfo {
    macAddress: string;
    fuerzaKg: number;
    profundidadMm: number;
    frecuenciaCpm: number;
    compresiones: number;
    compresionesCorrectas: number;
    recoilOk: boolean;
    enCompresion: boolean;
    compresionCorrecta: boolean;
    calidadPct: number;
    recoilPct: number;
    avgProfundidadMm: number;
    avgFuerzaKg: number;
    pausas: number;
    maxPausaSeg: number;
    sensorOk: boolean;
    calibrado: boolean;
    timestamp: number;
    isActive: boolean;
}

export interface ManiquiModel {
    id: string;
    name: string;
    uuid: string; // MAC address
    status: 'disponible' | 'en_uso' | 'mantenimiento' | 'offline';
    apiKey?: string;
    assignedTo?: string;
    currentSessionId?: string;
    lastConnection?: Date;
    updatedAt: Date;
}

// Parse raw RTDB snapshot into typed DeviceInfo
export function parseDeviceSnapshot(mac: string, raw: Record<string, unknown>): DeviceInfo {
    const ts = (raw.timestamp as number) ?? 0;
    return {
        macAddress: mac,
        fuerzaKg: (raw.fuerza_kg as number) ?? 0,
        profundidadMm: (raw.profundidad_mm as number) ?? 0,
        frecuenciaCpm: (raw.frecuencia_cpm as number) ?? 0,
        compresiones: (raw.compresiones as number) ?? 0,
        compresionesCorrectas: (raw.compresiones_correctas as number) ?? 0,
        recoilOk: (raw.recoil_ok as boolean) ?? false,
        enCompresion: (raw.en_compresion as boolean) ?? false,
        compresionCorrecta: (raw.compresion_correcta as boolean) ?? false,
        calidadPct: (raw.calidad_pct as number) ?? 0,
        recoilPct: (raw.recoil_pct as number) ?? 0,
        avgProfundidadMm: (raw.avg_profundidad_mm as number) ?? 0,
        avgFuerzaKg: (raw.avg_fuerza_kg as number) ?? 0,
        pausas: (raw.pausas as number) ?? 0,
        maxPausaSeg: (raw.max_pausa_seg as number) ?? 0,
        sensorOk: (raw.sensor_ok as boolean) ?? true,
        calibrado: (raw.calibrado as boolean) ?? false,
        timestamp: ts,
        isActive: ts > 0 && Date.now() - ts < 30_000,
    };
}