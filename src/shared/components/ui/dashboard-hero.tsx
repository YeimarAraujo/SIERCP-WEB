'use client';

import { useState } from 'react';
import { useAuth } from '@/shared/hooks/use-auth';
import { getUserInitials, getFullName } from '@/shared/types/user';
import { Settings, Bell, Calendar, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { NotificationsDrawer } from '@/shared/components/ui/notifications-drawer';

export function DashboardHero({ subtitle }: { subtitle: string }) {
    const { user } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    if (!user) return null;

    const today = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <>
            <div style={{
                background: '#FFFFFF',
                borderRadius: 32,
                padding: '32px 40px',
                marginBottom: 32,
                boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decoration */}
                <div style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1800AD 0%, transparent 100%)',
                    opacity: 0.03
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>


                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#1800AD', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{subtitle}</div>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#CBD5E1' }} />
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={14} /> {today}
                            </div>
                        </div>
                        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>
                            Bienvenido, {user.firstName}
                        </h1>
                        <p style={{ margin: '8px 0 0 0', fontSize: 15, color: '#64748B', fontWeight: 500 }}>
                            Panel de Control Institucional SIERCP • <span style={{ color: '#1800AD', fontWeight: 700 }}>{user.role}</span>
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <Link href="/profile" style={{
                        padding: '12px 20px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0',
                        color: '#475569', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10
                    }}>
                        <User size={18} /> Gestionar Perfil
                    </Link>
                    <div
                        onClick={() => setIsNotificationsOpen(true)}
                        style={{
                            width: 48, height: 48, borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        <Bell size={20} />
                        <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: `2px solid #FFFFFF` }} />
                    </div>
                </div>
            </div>

            <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </>
    );
}
