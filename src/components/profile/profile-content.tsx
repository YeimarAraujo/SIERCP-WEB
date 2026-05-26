'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserInitials, getFullName } from '@/models/user';
import { UserService } from '@/services/firestore.service';
import {
    User, Mail, Shield, IdCard, CheckCircle,
    Camera, Save, LogOut, Loader2, Edit3,
    Zap, Target, Award, Clock, ShieldCheck,
    Bell, Lock, History, Settings, Monitor
} from 'lucide-react';
import { MetricBar } from '@/components/charts/metric-bar';

export function ProfileContent() {
    const { user, logout, updateLocalUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        identificacion: user?.identificacion || '',
    });

    if (!user) return null;

    const stats = user.stats;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await UserService.update(user.uid, formData);
            updateLocalUser({ ...user, ...formData });
            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoClick = () => fileInputRef.current?.click();

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const simulatedUrl = URL.createObjectURL(file);
        try {
            setLoading(true);
            await UserService.update(user.uid, { avatarUrl: simulatedUrl });
            updateLocalUser({ ...user, avatarUrl: simulatedUrl });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Premium Profile Header Banner */}
            <div style={{
                position: 'relative', height: 200, borderRadius: 32, marginBottom: -60,
                background: 'linear-gradient(135deg, var(--brand) 0%, var(--clr-accent) 100%)', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: -20, left: '10%', width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32, padding: '0 32px' }}>

                {/* Left Column: Fixed Profile Info */}
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 28, padding: '32px 24px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                        <div style={{ position: 'relative', width: 140, height: 140, margin: '-100px auto 24px auto' }}>
                            <div
                                onClick={handlePhotoClick}
                                style={{
                                    width: '100%', height: '100%', borderRadius: 40, background: ' var(--bg-surface)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontSize: 40, fontWeight: 900,
                                    overflow: 'hidden', cursor: 'pointer', border: '6px solid var(--card)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : getUserInitials(user)}
                            </div>
                            <button
                                onClick={handlePhotoClick}
                                style={{ position: 'absolute', bottom: 5, right: 5, width: 40, height: 40, borderRadius: 14, background: 'var(--brand)', border: '3px solid var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-on-brand)', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
                            >
                                <Camera size={20} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--foreground)', margin: '0 0 4px 0' }}>{getFullName(user)}</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Mail size={14} /> {user.email}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                            <div style={{ background: 'var(--accent)', color: 'var(--brand)', padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>{user.role}</div>
                            <div style={{ background: '#ECFDF5', color: '#10B981', padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12} /> VERIFICADO</div>
                        </div>

                        {/* Navigation Links in Sidebar Style */}
                        <div style={{ display: 'grid', gap: 4, textAlign: 'left' }}>
                            <TabLink active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={User} label="Información General" />
                            <TabLink active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Lock} label="Seguridad" />
                            <TabLink active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={History} label="Historial de Acceso" />
                        </div>

                        <div style={{ height: 1, background: 'var(--muted)', margin: '24px 0' }} />

                        <button
                            onClick={logout}
                            style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                        >
                            <LogOut size={18} /> Cerrar Sesión
                        </button>
                    </div>

                    {/* AHA Badges / Certifications */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 28, padding: 24, marginTop: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: 13, fontWeight: 800, color: 'var(--foreground)', textTransform: 'uppercase' }}>Certificaciones</h4>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF7ED', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }} title="BLS Instructor">
                                <Award size={24} />
                            </div>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0F9FF', border: '1px solid #E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }} title="ACLS Instructor">
                                <Target size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tab Content */}
                <div style={{ paddingTop: 80 }}>
                    {activeTab === 'info' && (
                        <div style={{ display: 'grid', gap: 32 }}>
                            {/* Personal Info Form */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 28, padding: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--foreground)' }}>Información Personal</h3>
                                        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>Gestiona tus datos de contacto e identificación institucional.</p>
                                    </div>
                                    {!editing && (
                                        <button onClick={() => setEditing(true)} style={{ background: 'var(--muted)', border: 'none', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Edit3 size={16} /> Editar
                                        </button>
                                    )}
                                </div>

                                <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 28 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <InputGroup label="Nombre" disabled={!editing} value={formData.firstName} onChange={(v: string) => setFormData(p => ({ ...p, firstName: v }))} icon={User} />
                                        <InputGroup label="Apellido" disabled={!editing} value={formData.lastName} onChange={(v: string) => setFormData(p => ({ ...p, lastName: v }))} icon={User} />
                                    </div>
                                    <InputGroup label="Documento de Identificación" disabled={!editing} value={formData.identificacion} onChange={(v: string) => setFormData(p => ({ ...p, identificacion: v }))} icon={IdCard} />
                                    <InputGroup label="Correo Institucional" disabled value={user.email} onChange={() => { }} icon={Mail} />

                                    {editing && (
                                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                            <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'var(--muted)', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                                            <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: 14, background: 'var(--brand)', border: 'none', color: 'var(--text-on-brand)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Cambios
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Stats Summary */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 28, padding: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                        <Target size={22} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--foreground)' }}>Rendimiento Clínico Histórico</h3>
                                </div>
                                <div style={{ display: 'grid', gap: 24 }}>
                                    <MetricBar label="Precisión en Compresión (Profundidad)" value={stats?.averageDepthMm || 0} max={70} unit=" mm" color="#10B981" />
                                    <MetricBar label="Sincronización de Ritmo (Frecuencia)" value={stats?.averageRatePerMin || 0} max={130} unit=" /min" color="var(--brand)" />
                                    <MetricBar label="Puntaje de Certificación Acumulado" value={stats?.averageScore || 0} max={100} unit="%" color="var(--clr-accent)" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 28, padding: 40 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--foreground)', marginBottom: 8 }}>Seguridad de la Cuenta</h3>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 40 }}>Actualiza tu contraseña y configura la protección de tu cuenta institucional.</p>

                            <div style={{ display: 'grid', gap: 24 }}>
                                <SecurityAction icon={Lock} title="Cambiar Contraseña" description="Se recomienda usar una contraseña fuerte que no uses en otros sitios." action="Cambiar" />
                                <SecurityAction icon={ShieldCheck} title="Autenticación de Dos Factores" description="Añade una capa extra de seguridad a tu acceso (Próximamente)." action="Configurar" disabled />
                                <SecurityAction icon={Bell} title="Alertas de Inicio de Sesión" description="Recibe notificaciones cuando se acceda a tu cuenta desde un nuevo dispositivo." action="Activado" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 28, padding: 40 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--foreground)', marginBottom: 40 }}>Actividad de Sesión</h3>
                            <div style={{ display: 'grid', gap: 16 }}>
                                <ActivityRow device="Chrome en Windows" location="Bogotá, Colombia" date="Hoy, 10:45 AM" current />
                                <ActivityRow device="iPhone 15 - Safari" location="Bogotá, Colombia" date="Ayer, 08:20 PM" />
                                <ActivityRow device="Chrome en macOS" location="Medellín, Colombia" date="28 Abr 2024, 03:15 PM" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TabLink({ active, onClick, icon: Icon, label }: any) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
                cursor: 'pointer', background: active ? 'var(--muted)' : 'transparent',
                color: active ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: active ? 700 : 500,
                fontSize: 14, transition: 'all 0.2s'
            }}
        >
            <Icon size={18} /> {label}
        </div>
    );
}

function InputGroup({ label, value, onChange, disabled, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; icon: any }) {
    return (
        <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <Icon size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    disabled={disabled}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        width: '100%', padding: '14px 16px 14px 48px', borderRadius: 14,
                        border: '1px solid var(--border)', fontSize: 14, outline: 'none',
                        background: disabled ? 'var(--muted)' : 'var(--card)', color: disabled ? 'var(--text-secondary)' : 'var(--foreground)',
                        transition: 'border-color 0.2s'
                    }}
                />
            </div>
        </div>
    );
}

function SecurityAction({ icon: Icon, title, description, action, disabled }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: 20, background: 'var(--muted)', border: '1px solid var(--muted)' }}>
            <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                    <Icon size={20} />
                </div>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{description}</div>
                </div>
            </div>
            <button disabled={disabled} style={{ padding: '8px 16px', borderRadius: 10, background: disabled ? 'var(--muted)' : 'var(--card)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: disabled ? 'var(--text-muted)' : 'var(--brand)', cursor: disabled ? 'default' : 'pointer' }}>
                {action}
            </button>
        </div>
    );
}

function ActivityRow({ device, location, date, current }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--muted)', background: current ? '#F0FDF4' : 'transparent' }}>
            <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <Monitor size={16} />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{device} {current && <span style={{ color: '#10B981', fontSize: 11, marginLeft: 8 }}>• Sesión actual</span>}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{location}</div>
                </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{date}</div>
        </div>
    );
}
