import type { ReactNode } from 'react';
import AuthNavbar from '@/components/layout/auth-navbar';

export default function AuthFormLayout({ children }: { children: ReactNode }) {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isLogin = pathname === '/login';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
        }}>
            <AuthNavbar />
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                flex: 1,
                overflow: 'hidden',
            }}>
                {/* Left Column - Background Image + Overlay */}
                <div
                    style={{
                        width: '45%',
                        minWidth: '400px',
                        flexShrink: 0,
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundImage: "url('/images/login.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '0',
                            background: 'linear-gradient(135deg, rgba(14,0,128,0.80) 0%, rgba(10,8,40,0.90) 100%)',
                            zIndex: 0,
                        }}
                    />
                    {/* Content over overlay */}
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            padding: '40px 32px',
                            textAlign: 'center',
                        }}
                    >
                        <img
                            src="/images/logov3.png"
                            alt="SIERCP"
                            style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '16px' }}
                        />
                        <h2 className="text-2xl font-bold text-white">SIERCP</h2>
                        <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Entrena mejor, salva más vidas
                        </p>
                        {!isLogin && (
                            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '220px', textAlign: 'center' }}>
                                Únete a la plataforma de entrenamiento RCP más avanzada
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column - Form */}
                <div
                    style={{
                        flex: 1,
                        height: '100%',
                        overflowY: 'auto',
                        background: '#12142a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '48px 64px',
                    }}
                >
                    {/* Mobile logo */}
                    <div className="md:hidden absolute top-6 left-1/2 -translate-x-1/2">
                        <img
                            src="/images/logov3.png"
                            alt="SIERCP"
                            style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                        />
                    </div>
                    <div className="w-full max-w-md px-6 py-10 md:py-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
