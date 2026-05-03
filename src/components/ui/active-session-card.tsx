'use client';

import { Cpu } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface ActiveSessionInfo {
    id: string;
    status: string;
    hardware: string;
    location: string;
}

interface ActiveSessionCardProps {
    session?: ActiveSessionInfo | null;
}

export function ActiveSessionCard({ session }: ActiveSessionCardProps) {
    if (!session) {
        return (
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-slate-50 h-full">
                <EmptyState
                    title="Sin sesión activa"
                    description="Conecta un sensor ESP32 para iniciar una sesión de entrenamiento."
                />
            </div>
        );
    }

    const { id, status, hardware, location } = session;

    return (
        <div className="relative bg-gradient-to-br from-[#2b1055] to-[#7597de] rounded-[2rem] p-6 text-white shadow-[0_20px_50px_rgba(8,112,184,0.15)] min-h-[220px] flex flex-col justify-between overflow-hidden
            hover:scale-[1.02] hover:shadow-[0_24px_56px_rgba(8,112,184,0.22)] transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-6 translate-y-6" />

            <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-[11px] opacity-80 mb-1 uppercase tracking-[1px]">Active Session</p>
                    <h3 className="text-lg font-bold m-0">ID: {id}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Cpu size={20} />
                </div>
            </div>

            <div className="z-10 mt-auto mb-4">
                <p className="text-base tracking-wide font-medium opacity-90">Estado: &#x1f4e1; {status}</p>
                <p className="text-sm mt-1 opacity-80">Hardware: {hardware}</p>
            </div>

            <p className="text-xs opacity-70 z-10">Ubicación: {location}</p>
        </div>
    );
}
