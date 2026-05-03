'use client';

import { Activity, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface DeviceStatusInfo {
    name: string;
    compression: number;
    bpm: number;
}

interface DeviceControlCardProps {
    device?: DeviceStatusInfo | null;
    onFinish?: () => void;
}

export function DeviceControlCard({ device, onFinish }: DeviceControlCardProps) {
    if (!device) {
        return (
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-slate-50 h-full">
                <EmptyState
                    title="Sin dispositivo conectado"
                    description="Empareja un maniquí de RCP para ver el control en vivo."
                />
            </div>
        );
    }

    const { name, compression, bpm } = device;

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(8,112,184,0.07)] flex flex-col h-full border border-slate-50
            hover:scale-[1.02] hover:shadow-[0_24px_56px_rgba(8,112,184,0.12)] transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-800 mb-6">
                Control de Dispositivo en Vivo
            </h3>

            <div className="flex items-center justify-between border border-slate-100 rounded-2xl p-3 mb-6">
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium">
                    <span className="text-blue-600 font-bold">{name}</span>
                </span>
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Activity size={20} className="text-emerald-500" />
                </div>
                <input
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-4 font-bold tracking-wider text-slate-700 text-lg outline-none"
                    readOnly
                    type="text"
                    value={`${compression}% Compresión`}
                />
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between mb-6">
                <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-emerald-500">{bpm}</span>
                    <span className="text-sm text-slate-400 mb-1 font-medium">bpm</span>
                </div>
                <Heart size={28} className="text-emerald-500" />
            </div>

            <button
                disabled
                onClick={onFinish}
                className="w-full bg-blue-400 text-white/70 rounded-2xl py-4 font-semibold transition-colors mt-auto cursor-not-allowed"
                title="Próximamente"
            >
                Finalizar y Generar Reporte 📊
            </button>
        </div>
    );
}
