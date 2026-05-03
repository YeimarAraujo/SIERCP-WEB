'use client';

import { RefreshCw, Plus, ChevronLeft, ChevronRight, BatteryCharging } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { ESP32Device } from '@/lib/dashboard-data';

interface IoTCardProps {
    device?: ESP32Device | null;
    onlineDevices?: number;
    totalDevices?: number;
}

export function IoTCard({ device, onlineDevices = 0, totalDevices = 0 }: IoTCardProps) {
    if (!device) {
        return (
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-slate-50 h-full">
                <EmptyState
                    title="Sin sensores IoT"
                    description="Conecta un dispositivo ESP32 para ver los sensores disponibles."
                />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(8,112,184,0.07)] flex flex-col h-full border border-slate-50
            hover:shadow-[0_24px_56px_rgba(8,112,184,0.12)] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Sensores IoT</h3>
                <div className="bg-slate-50 rounded-full p-1 flex">
                    <button className="px-4 py-1 text-xs font-semibold bg-white rounded-full shadow-sm text-blue-600">
                        Activos ({onlineDevices})
                    </button>
                    <button className="px-4 py-1 text-xs font-medium text-slate-500 rounded-full">
                        En Mantenimiento ({totalDevices - onlineDevices})
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between border border-slate-100 rounded-2xl p-3 mb-6">
                <button className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <ChevronLeft size={14} />
                </button>
                <div className="text-sm font-medium">
                    <span className="text-blue-600 font-bold">{device.name}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                        {device.hardware} · {device.serialNumber}
                    </div>
                </div>
                <button className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <ChevronRight size={14} />
                </button>
            </div>

            <div className="mb-6">
                <div className="text-sm text-slate-500 mb-2">Sensores del dispositivo</div>
                <div className="flex flex-col gap-2">
                    {device.sensors.map((sensor, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            {sensor}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="text-sm text-slate-500 mb-1">Compresión AHA</div>
                    <div className="text-xl font-bold text-emerald-500">
                        {device.compressionAccuracy}%
                        <span className="text-xs font-normal opacity-70"> ( precisión )</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        disabled
                        className="text-xs text-slate-400 font-medium flex items-center gap-1 cursor-not-allowed"
                        title="Próximamente"
                    >
                        <RefreshCw size={12} /> Sincronizar
                    </button>
                    <button
                        disabled
                        className="text-xs text-slate-400 font-medium flex items-center gap-1 cursor-not-allowed"
                        title="Próximamente"
                    >
                        <Plus size={12} /> Nuevo sensor
                    </button>
                </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 flex-1 flex flex-col justify-center border border-blue-50">
                <div className="flex gap-4">
                    <div className="bg-white rounded-xl px-4 py-3 flex-1 flex flex-col border border-slate-100 shadow-sm">
                        <span className="text-xs text-slate-500">Conexión</span>
                        <span className="font-bold text-sm text-emerald-600 mt-1">
                            {device.connectionStatus === 'online' ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    <div className="bg-white rounded-xl px-4 py-3 flex-1 flex flex-col border border-slate-100 shadow-sm">
                        <span className="text-xs text-slate-500">Batería ESP32</span>
                        <span className="font-bold text-lg text-emerald-500 mt-1 flex items-center gap-1">
                            {device.batteryLevel}%
                            <BatteryCharging size={16} />
                        </span>
                    </div>
                </div>
                {device.connectionStatus !== 'online' && (
                    <p className="text-xs text-amber-600 mt-3 text-center font-medium">
                        ESP32 no conectado — esperando emparejamiento Bluetooth
                    </p>
                )}
            </div>
        </div>
    );
}
