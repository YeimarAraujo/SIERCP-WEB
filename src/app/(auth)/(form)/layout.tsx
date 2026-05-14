'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import AuthNavbar from '@/components/layout/auth-navbar';
import { useThemeStore } from '@/stores/theme-store';
import { useEffect } from 'react';

export default function AuthFormLayout({ children }: { children: ReactNode }) {
    const { theme } = useThemeStore();
    const isLogin = typeof window !== 'undefined' ? window.location.pathname === '/login' : true;

    useEffect(() => {
        // Sync theme with global CSS variables if needed, though they handle it automatically via data-theme
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, [theme]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            background: 'var(--clr-bg)',
            transition: 'background 0.5s ease',
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
                    className="d-none d-lg-block"
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
                            background: theme === 'dark'
                                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(67, 56, 202, 0.8) 100%)'
                                : 'linear-gradient(135deg, rgba(24, 0, 173, 0.8) 0%, rgba(109, 74, 255, 0.8) 100%)',
                            zIndex: 0,
                            transition: 'background 0.5s ease',
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
                        <Link href="/">
                            <img
                                src="/assets/JOMAR/LogoTextov2.png"
                                alt="SIERCP"
                                style={{ width: '180px', height: 'auto', objectFit: 'contain', marginBottom: '24px', filter: 'brightness(0) invert(1)' }}
                            />
                        </Link>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '8px' }}>
                            SIERCP Portal
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: '300px' }}>
                            Entrena mejor, salva más vidas con nuestra plataforma interactiva.
                        </p>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div
                    style={{
                        flex: 1,
                        height: '100%',
                        overflowY: 'auto',
                        background: 'var(--clr-bg)',
                        display: 'flex',
                        alignItems: 'flex-start', // Change from center to flex-start for better scroll behavior
                        justifyContent: 'center',
                        padding: '120px 24px 60px', // Top padding (120px) accounts for Navbar (90px) + gap
                        transition: 'background 0.5s ease',
                        position: 'relative'
                    }}
                >
                    {/* Mobile logo - hidden when navbar is present, or positioned better */}
                    <div className="d-lg-none" style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                        {/* The Navbar already has a logo, so this might be redundant if Navbar is shown. 
                            However, if Navbar is fixed, we just need to ensure the form starts below it. */}
                    </div>

                    <div style={{
                        width: '100%',
                        maxWidth: '520px', // Increased slightly for better layout
                        background: 'var(--clr-bg-surface)',
                        padding: '40px 32px',
                        borderRadius: '24px',
                        border: '1px solid var(--clr-border)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
                        animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        marginTop: '20px' // Extra spacing
                    }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
