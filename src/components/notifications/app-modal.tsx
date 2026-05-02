'use client';

import { useState } from 'react';
import { X, Smartphone, Download } from 'lucide-react';
import { useAppBanner } from '@/hooks/use-push-notifications';

interface DesktopAppModalProps {
    onInstall?: () => void;
}

export function DesktopAppModal({ onInstall }: DesktopAppModalProps) {
    const [show, setShow] = useState(true);
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('siercp-app-modal-dismissed') === 'true';
        }
        return false;
    });

    if (dismissed) return null;

    const handleDismiss = () => {
        setShow(false);
        setTimeout(() => {
            setDismissed(true);
            localStorage.setItem('siercp-app-modal-dismissed', 'true');
        }, 300);
    };

    const handleInstall = () => {
        onInstall?.();
        handleDismiss();
    };

    return (
        <div 
            className={`
                fixed inset-0 z-50 flex items-center justify-center p-4
                transition-all duration-300
                ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
            style={{ background: 'rgba(14, 0, 128, 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && handleDismiss()}
        >
            <div 
                className="w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                style={{ 
                    background: 'linear-gradient(135deg, #1C1070 0%, #0E0080 100%)',
                    border: '1px solid rgba(199, 210, 254, 0.2)',
                }}
            >
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-1.5 rounded-full transition-colors hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    aria-label="Cerrar"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div 
                        className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                        <Smartphone className="w-10 h-10" style={{ color: '#38BDF8' }} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Descarga la app móvil
                    </h2>
                    <p className="text-sm" style={{ color: 'rgba(165, 180, 252, 0.9)' }}>
                        Lleva SIERCP a tu teléfono. Entrena sin conexión, recibe notificaciones en tiempo real y accede más rápido.
                    </p>
                </div>

                <div 
                    className="rounded-xl p-4 mb-5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                        <span className="text-sm text-white">Entrena sin conexión a internet</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                        <span className="text-sm text-white">Notificaciones en tiempo real</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                        <span className="text-sm text-white">Acceso rápido desde tu pantalla de inicio</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleInstall}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-transform hover:scale-[1.02]"
                        style={{ 
                            background: '#FFFFFF',
                            color: '#0E0080',
                        }}
                    >
                        <Download className="w-5 h-5" />
                        Descargar ahora
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="px-4 py-3 rounded-xl font-medium transition-colors"
                        style={{ 
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.7)',
                        }}
                    >
                        Talvez más tarde
                    </button>
                </div>
            </div>
        </div>
    );
}

interface FirstTimeUserBannerProps {
    onDismiss?: () => void;
}

export function FirstTimeUserBanner({ onDismiss }: FirstTimeUserBannerProps) {
    const [show, setShow] = useState(true);
    const [isClosing, setIsClosing] = useState(false);

    const handleDismiss = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShow(false);
            localStorage.setItem('siercp-first-visit', 'false');
            onDismiss?.();
        }, 300);
    };

    if (!show || typeof window !== 'undefined' && localStorage.getItem('siercp-first-visit') === 'false') {
        return null;
    }

    return (
        <div
            className={`
                w-full rounded-xl p-4 mb-4 transition-all duration-300
                ${isClosing ? 'opacity-0 translate-y-[-10px]' : 'opacity-100 translate-y-0'}
            `}
            style={{ 
                background: 'linear-gradient(90deg, rgba(24, 0, 173, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)',
                border: '1px solid rgba(24, 0, 173, 0.15)',
            }}
        >
            <div className="flex items-center gap-4">
                <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(24, 0, 173, 0.1)' }}
                >
                    <Smartphone className="w-5 h-5" style={{ color: '#1800AD' }} />
                </div>

                <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        ¿Primera vez aquí? Descarga nuestra app para la mejor experiencia
                    </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={handleDismiss}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ 
                            background: 'rgba(24, 0, 173, 0.1)',
                            color: '#1800AD',
                        }}
                    >
                        Instalar app
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ color: '#6B7280' }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}