'use client';

import { useAuth } from '@/hooks/use-auth';
import { getUserInitials } from '@/models/user';
import { ChevronRight, Home, Layout } from 'lucide-react';
import Link from 'next/link';

interface PageHeroProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    parentTitle?: string;
    parentHref?: string;
}

export function PageHero({ title, subtitle, actions, parentTitle, parentHref }: PageHeroProps) {
    const { user } = useAuth();

    return (
        <div className="surface-glass lighting-border" style={{ 
            background: 'var(--card)', 
            borderRadius: 24, 
            padding: '24px 32px', 
            marginBottom: 32, 
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Accent */}
            <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: 4, 
                height: '100%', 
                background: 'linear-gradient(to bottom, var(--brand), var(--clr-accent))' 
            }} />

            <div>
                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Home size={14} />
                    <ChevronRight size={12} />
                    {parentTitle && parentHref ? (
                        <>
                            <Link href={parentHref} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{parentTitle}</Link>
                            <ChevronRight size={12} />
                        </>
                    ) : (
                        <>
                            <span>Panel</span>
                            <ChevronRight size={12} />
                        </>
                    )}
                    <span style={{ color: 'var(--brand)' }}>{title}</span>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                    {title}
                </h1>
                {subtitle && (
                    <p style={{ margin: '6px 0 0 0', fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {subtitle}
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {actions && <div style={{ display: 'flex', gap: 12 }}>{actions}</div>}
            </div>
        </div>
    );
}
