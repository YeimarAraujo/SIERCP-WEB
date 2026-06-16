'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Info, AlertTriangle, Zap, Clock, ChevronRight, Award, Activity as ActivityIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ActivityService } from '@/shared/lib/firestore.service';
import { useAuth } from '@/shared/hooks/use-auth';

export function NotificationsDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchActivity();
        }
    }, [isOpen, user]);

    const fetchActivity = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await ActivityService.getRecentActivity(user.uid, {
                role: user.role,
                institutionId: user.institutionId,
            });
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getIcon = (iconName: string) => {
        switch(iconName) {
            case 'Award': return Award;
            case 'Activity': return ActivityIcon;
            case 'Zap': return Zap;
            default: return Info;
        }
    };

    return (
        <div style={{ 
            position: 'fixed', inset: 0, zIndex: 9999, 
            background: 'rgba(15, 23, 42, 0.1)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'flex-end'
        }} onClick={onClose}>
            <div 
                style={{ 
                    width: '100%', maxWidth: 400, background: 'var(--card)', height: '100%', 
                    boxShadow: '-10px 0 30px -5px rgba(0, 0, 0, 0.1)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'slideIn 0.3s ease-out'
                }} 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                            <Bell size={20} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--foreground)' }}>Notificaciones</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--muted)', border: '1px solid var(--border)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>RECIENTES</span>
                        <button onClick={fetchActivity} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Actualizar</button>
                    </div>

                    <div style={{ display: 'grid', gap: 16 }}>
                        {loading ? (
                            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                <Loader2 size={24} style={{ color: 'var(--brand)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                                No hay actividad reciente en tus cursos.
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const Icon = getIcon(n.icon);
                                return (
                                    <div key={n.id} style={{ 
                                        padding: '16px', borderRadius: 20, background: 'var(--muted)', border: '1px solid var(--muted)',
                                        display: 'flex', gap: 14, cursor: 'pointer', transition: 'transform 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateX(-4px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}
                                    >
                                        <div style={{ 
                                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                            background: n.type === 'success' ? '#ECFDF5' : n.type === 'warning' ? '#FFFBEB' : '#EFF6FF',
                                            color: n.type === 'success' ? '#10B981' : n.type === 'warning' ? '#F59E0B' : '#3B82F6',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Icon size={18} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 14, marginBottom: 4 }}>{n.title}</div>
                                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.desc}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                                <Clock size={12} /> {n.time}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)' }}>
                    <button style={{ width: '100%', padding: '14px', borderRadius: 16, background: 'var(--brand)', border: 'none', color: 'var(--text-on-brand)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        Ver todas las notificaciones <ChevronRight size={18} />
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
