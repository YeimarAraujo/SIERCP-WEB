'use client';

import { useState } from 'react';
import { X, Smartphone, Download, Bell } from 'lucide-react';
import { useAppBanner } from '@/hooks/use-push-notifications';

export function AppInstallBanner() {
    const { shouldShow, isMobile, dismiss } = useAppBanner();
    const [isClosing, setIsClosing] = useState(false);

    if (!shouldShow) return null;

    const handleDismiss = () => {
        setIsClosing(true);
        setTimeout(() => dismiss(), 300);
    };

    return (
        <div
            className={`
                fixed bottom-0 left-0 right-0 z-50
                transition-all duration-300 ease-out
                ${isClosing ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'}
                md:bottom-4 md:left-auto md:right-4 md:left-auto md:max-w-sm
            `}
        >
            <div 
                className="relative rounded-t-2xl md:rounded-2xl p-5 shadow-2xl"
                style={{ 
                    background: 'linear-gradient(135deg, #1C1070 0%, #1A0090 100%)',
                    border: '1px solid rgba(199, 210, 254, 0.15)',
                }}
            >
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1.5 rounded-full transition-colors"
                    style={{ 
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                    }}
                    aria-label="Cerrar"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4 pr-8">
                    <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                        <Smartphone className="w-6 h-6" style={{ color: '#38BDF8' }} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-base mb-1">
                            Descarga la app móvil
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'rgba(165, 180, 252, 0.9)' }}>
                            {isMobile 
                                ? 'Instala SIERCP para una mejor experiencia de entrenamiento'
                                : 'Lleva SIERCP a tu teléfono y entrena desde cualquier lugar'
                            }
                        </p>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={handleDismiss}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{ 
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                }}
                            >
                                <Download className="w-4 h-4" />
                                Instalar
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{ 
                                    background: 'transparent',
                                    color: 'rgba(165, 180, 252, 0.8)',
                                    border: '1px solid rgba(165, 180, 252, 0.3)',
                                }}
                            >
                                Quizas más tarde
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface NotificationPromptProps {
    onPermissionGranted?: () => void;
}

export function NotificationPrompt({ onPermissionGranted }: NotificationPromptProps) {
    const [show, setShow] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleEnable = async () => {
        setIsLoading(true);
        try {
            const { usePushNotifications } = await import('@/hooks/use-push-notifications');
            const { requestPermission } = usePushNotifications();
            const token = await requestPermission();
            if (token) {
                onPermissionGranted?.();
                setShow(false);
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div 
            className="rounded-xl p-4 mb-4"
            style={{ 
                background: 'rgba(24, 0, 173, 0.05)',
                border: '1px solid rgba(24, 0, 173, 0.1)',
            }}
        >
            <div className="flex items-start gap-3">
                <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(24, 0, 173, 0.1)' }}
                >
                    <Bell className="w-5 h-5" style={{ color: '#1800AD' }} />
                </div>

                <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1" style={{ color: '#1F2937' }}>
                        Mantente informado
                    </h4>
                    <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
                        Recibe notificaciones sobre tus sesiones y recordatorios de entrenamiento
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={handleEnable}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            style={{ 
                                background: '#1800AD',
                                color: 'white',
                            }}
                        >
                            {isLoading ? 'Habilitando...' : 'Habilitar notificaciones'}
                        </button>
                        <button
                            onClick={() => setShow(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{ color: '#6B7280' }}
                        >
                            Ahora no
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface AppDownloadPromptProps {
    className?: string;
}

export function AppDownloadPrompt({ className }: AppDownloadPromptProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const handleDismiss = () => {
        setIsClosing(true);
        setTimeout(() => setDismissed(true), 300);
    };

    if (dismissed) return null;

    return (
        <div
            className={`
                ${className || ''}
                transition-all duration-300 ease-out
                ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            `}
        >
            <div 
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{ 
                    background: 'linear-gradient(135deg, #1C1070 0%, #1A0090 100%)',
                    border: '1px solid rgba(199, 210, 254, 0.2)',
                }}
            >
                <div 
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10"
                    style={{ background: '#38BDF8' }}
                />
                
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full transition-colors"
                    style={{ 
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                    }}
                    aria-label="Cerrar"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                    <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                        <Smartphone className="w-7 h-7" style={{ color: '#38BDF8' }} />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">
                            App móvil SIERCP
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'rgba(165, 180, 252, 0.85)' }}>
                            Descárgala para entrenar sin conexión y recibir notificaciones en tiempo real
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleDismiss}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-transform hover:scale-105"
                                style={{ 
                                    background: '#FFFFFF',
                                    color: '#0E0080',
                                }}
                            >
                                <Download className="w-4 h-4" />
                                Descargar app
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}