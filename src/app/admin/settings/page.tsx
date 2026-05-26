'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import {
    Building2, ShieldCheck, Bell, Smartphone, Lock, Database,
    Save, Globe, Mail, Phone, MapPin, ChevronRight, RefreshCw,
    AlertTriangle, Download, Key, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type Section = 'institucion' | 'aha' | 'notificaciones' | 'app' | 'seguridad' | 'backup';

interface InstitutionData {
    name: string;
    nit: string;
    city: string;
    phone: string;
    email: string;
    address: string;
    website: string;
    logoUrl: string;
}

interface AhaConfig {
    minScore: number;
    certScore: number;
    maxRetries: number;
    sessionDurationMin: number;
}

interface NotifConfig {
    emailOnNewStudent: boolean;
    emailOnCourseComplete: boolean;
    emailOnPayment: boolean;
    emailOnCertIssued: boolean;
    adminEmail: string;
    whatsappEnabled: boolean;
    whatsappNumber: string;
}

interface AppConfig {
    bleEnabled: boolean;
    sessionRecordingEnabled: boolean;
    certificatesEnabled: boolean;
    paymentsEnabled: boolean;
    maxSessionsPerDay: number;
}

interface SecurityConfig {
    requireStrongPassword: boolean;
    sessionTimeoutMin: number;
    twoFactorEnabled: boolean;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelSt: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };
const inputSt: React.CSSProperties = { width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)', fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
const cardSt: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px 28px', display: 'grid', gap: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Shared components ─────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{label}</p>
                {desc && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</p>}
            </div>
            <button
                onClick={() => onChange(!value)}
                style={{ width: 48, height: 26, borderRadius: 13, border: 'none', background: value ? 'var(--brand)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
            >
                <span style={{ position: 'absolute', top: 3, left: value ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
        </div>
    );
}

function FormField({ label, icon: Icon, value, onChange, type = 'text', placeholder }: {
    label: string; icon?: React.ElementType; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
    return (
        <div>
            <label style={labelSt}>{label}</label>
            <div style={{ position: 'relative' }}>
                {Icon && <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />}
                <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={e => onChange(e.target.value)}
                    style={{ ...inputSt, paddingLeft: Icon ? 40 : 14 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--brand)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                />
            </div>
        </div>
    );
}

function NavItem({ icon: Icon, label, active, badge, onClick }: { icon: React.ElementType; label: string; active: boolean; badge?: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                borderRadius: 14, border: 'none', fontSize: 13,
                fontWeight: active ? 800 : 600,
                background: active ? 'var(--brand)' : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--muted)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
        >
            <Icon size={16} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge !== undefined && badge > 0 && (
                <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'var(--brand)', color: active ? '#fff' : '#fff', fontSize: 10, fontWeight: 900, padding: '1px 7px', borderRadius: 20 }}>{badge}</span>
            )}
            {active && <ChevronRight size={14} />}
        </button>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [section, setSection] = useState<Section>('institucion');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [institution, setInstitution] = useState<InstitutionData>({
        name: '', nit: '', city: '', phone: '', email: '', address: '', website: '', logoUrl: '',
    });
    const [aha, setAha] = useState<AhaConfig>({ minScore: 75, certScore: 85, maxRetries: 3, sessionDurationMin: 60 });
    const [notif, setNotif] = useState<NotifConfig>({
        emailOnNewStudent: true, emailOnCourseComplete: true, emailOnPayment: true, emailOnCertIssued: true,
        adminEmail: '', whatsappEnabled: false, whatsappNumber: '',
    });
    const [appCfg, setAppCfg] = useState<AppConfig>({
        bleEnabled: true, sessionRecordingEnabled: true, certificatesEnabled: true, paymentsEnabled: false, maxSessionsPerDay: 20,
    });
    const [security, setSecurity] = useState<SecurityConfig>({ requireStrongPassword: true, sessionTimeoutMin: 60, twoFactorEnabled: false });

    useEffect(() => {
        if (!user?.institutionId || !db) { setLoading(false); return; }
        getDoc(doc(db, 'institutions', user.institutionId)).then(snap => {
            if (!snap.exists()) return;
            const d = snap.data();
            setInstitution({
                name: d.name || '', nit: d.nit || '', city: d.city || '',
                phone: d.phone || '', email: d.email || '', address: d.address || '',
                website: d.website || '', logoUrl: d.logoUrl || '',
            });
            if (d.minScore) setAha(prev => ({ ...prev, minScore: d.minScore, certScore: d.certScore ?? 85 }));
            if (d.notifications) setNotif(prev => ({ ...prev, ...d.notifications }));
            if (d.appConfig) setAppCfg(prev => ({ ...prev, ...d.appConfig }));
            if (d.security) setSecurity(prev => ({ ...prev, ...d.security }));
        }).catch(console.error).finally(() => setLoading(false));
    }, [user]);

    const handleSave = async () => {
        if (!user?.institutionId || !db) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'institutions', user.institutionId), {
                ...institution,
                minScore: aha.minScore, certScore: aha.certScore,
                notifications: notif,
                appConfig: appCfg,
                security,
                updatedAt: serverTimestamp(),
            });
            toast.success('Configuración guardada exitosamente');
        } catch (e) {
            console.error(e);
            toast.error('Error al guardar la configuración');
        } finally { setSaving(false); }
    };

    const navItems: { id: Section; icon: React.ElementType; label: string }[] = [
        { id: 'institucion', icon: Building2, label: 'Institución' },
        { id: 'aha', icon: ShieldCheck, label: 'Estándares AHA' },
        { id: 'notificaciones', icon: Bell, label: 'Notificaciones' },
        { id: 'app', icon: Smartphone, label: 'App Móvil' },
        { id: 'seguridad', icon: Lock, label: 'Seguridad' },
        { id: 'backup', icon: Database, label: 'Backup & Datos' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Configuración" />
            <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
                <PageHero
                    title="Ajustes Institucionales"
                    subtitle="Control centralizado de parámetros, notificaciones, app móvil y seguridad de tu institución"
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 14, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(24,0,173,0.2)' }}
                        >
                            {saving ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                            {saving ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
                    {/* Sidebar */}
                    <nav style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 12, display: 'grid', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 0 }}>
                        {navItems.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} active={section === n.id} onClick={() => setSection(n.id)} />)}
                    </nav>

                    {/* Content */}
                    <div style={{ display: 'grid', gap: 20 }}>

                        {/* ── INSTITUCIÓN ── */}
                        {section === 'institucion' && (
                            <>
                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Building2 size={20} style={{ color: 'var(--brand)' }} /> Identidad institucional
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                        <FormField label="Nombre legal" icon={Building2} value={institution.name} onChange={v => setInstitution(p => ({ ...p, name: v }))} />
                                        <FormField label="NIT / RUT" icon={FileText} value={institution.nit} onChange={v => setInstitution(p => ({ ...p, nit: v }))} />
                                        <FormField label="Correo institucional" icon={Mail} value={institution.email} onChange={v => setInstitution(p => ({ ...p, email: v }))} type="email" />
                                        <FormField label="Teléfono de contacto" icon={Phone} value={institution.phone} onChange={v => setInstitution(p => ({ ...p, phone: v }))} />
                                        <FormField label="Ciudad" icon={Globe} value={institution.city} onChange={v => setInstitution(p => ({ ...p, city: v }))} />
                                        <FormField label="Sitio web" icon={Globe} value={institution.website} onChange={v => setInstitution(p => ({ ...p, website: v }))} placeholder="https://miempresa.com" />
                                    </div>
                                    <FormField label="Dirección física" icon={MapPin} value={institution.address} onChange={v => setInstitution(p => ({ ...p, address: v }))} />
                                </div>

                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>Identidad visual</h3>
                                    <FormField label="URL del logotipo" value={institution.logoUrl} onChange={v => setInstitution(p => ({ ...p, logoUrl: v }))} placeholder="https://cdn.miempresa.com/logo.png" />
                                    {institution.logoUrl && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={institution.logoUrl} alt="Logo" style={{ height: 56, borderRadius: 10, border: '1px solid var(--border)', objectFit: 'contain', padding: 6, background: '#fff' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Vista previa del logotipo</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── ESTÁNDARES AHA ── */}
                        {section === 'aha' && (
                            <>
                                <div style={cardSt}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <ShieldCheck size={20} style={{ color: '#10b981' }} /> Criterios de evaluación AHA
                                        </h3>
                                        <span style={{ background: '#ECFDF5', color: '#10b981', padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 900 }}>AHA 2025 COMPLIANT</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        Estos parámetros determinan las notas mínimas para aprobar y certificar a los estudiantes en tu institución. Deben cumplir con los estándares AHA 2025.
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        {[
                                            { label: 'Score mínimo para aprobar', key: 'minScore' as const, color: 'var(--brand,#2563eb)' },
                                            { label: 'Score mínimo para certificar', key: 'certScore' as const, color: '#10b981' },
                                        ].map(({ label, key, color }) => (
                                            <div key={key} style={{ background: 'var(--muted)', padding: '20px 22px', borderRadius: 16 }}>
                                                <label style={{ ...labelSt, color }}>{label}</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                    <input
                                                        type="range" min="0" max="100"
                                                        value={aha[key]}
                                                        onChange={e => setAha(p => ({ ...p, [key]: Number(e.target.value) }))}
                                                        style={{ flex: 1, accentColor: color }}
                                                    />
                                                    <span style={{ fontSize: 24, fontWeight: 900, color, minWidth: 52, textAlign: 'right' }}>{aha[key]}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>Parámetros de sesión</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                        <div>
                                            <label style={labelSt}>Intentos máximos por evaluación</label>
                                            <input style={inputSt} type="number" min="1" max="10" value={aha.maxRetries} onChange={e => setAha(p => ({ ...p, maxRetries: Number(e.target.value) }))} />
                                            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>Número de veces que un estudiante puede repetir un quiz</p>
                                        </div>
                                        <div>
                                            <label style={labelSt}>Duración máxima de sesión BLE (min)</label>
                                            <input style={inputSt} type="number" min="5" max="240" value={aha.sessionDurationMin} onChange={e => setAha(p => ({ ...p, sessionDurationMin: Number(e.target.value) }))} />
                                            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>Tiempo máximo de una sesión con el maniquí antes de auto-cerrar</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── NOTIFICACIONES ── */}
                        {section === 'notificaciones' && (
                            <>
                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Mail size={20} style={{ color: '#f59e0b' }} /> Notificaciones por email
                                    </h3>
                                    <FormField label="Email del administrador (receptor de alertas)" icon={Mail} value={notif.adminEmail} onChange={v => setNotif(p => ({ ...p, adminEmail: v }))} type="email" placeholder="admin@miempresa.com" />
                                    <div style={{ display: 'grid', gap: 16 }}>
                                        <Toggle value={notif.emailOnNewStudent} onChange={v => setNotif(p => ({ ...p, emailOnNewStudent: v }))} label="Nuevo estudiante inscrito" desc="Recibir alerta cuando un nuevo estudiante se une a un curso" />
                                        <div style={{ height: 1, background: 'var(--border)' }} />
                                        <Toggle value={notif.emailOnCourseComplete} onChange={v => setNotif(p => ({ ...p, emailOnCourseComplete: v }))} label="Curso completado" desc="Notificación cuando un estudiante termina un curso" />
                                        <div style={{ height: 1, background: 'var(--border)' }} />
                                        <Toggle value={notif.emailOnPayment} onChange={v => setNotif(p => ({ ...p, emailOnPayment: v }))} label="Pago recibido" desc="Alerta cuando se procesa un pago exitoso" />
                                        <div style={{ height: 1, background: 'var(--border)' }} />
                                        <Toggle value={notif.emailOnCertIssued} onChange={v => setNotif(p => ({ ...p, emailOnCertIssued: v }))} label="Certificado emitido" desc="Cuando se genera un certificado AHA para un estudiante" />
                                    </div>
                                </div>

                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Smartphone size={20} style={{ color: '#25d366' }} /> Notificaciones WhatsApp
                                    </h3>
                                    <Toggle value={notif.whatsappEnabled} onChange={v => setNotif(p => ({ ...p, whatsappEnabled: v }))} label="Activar notificaciones vía WhatsApp" desc="Requiere número de WhatsApp Business registrado" />
                                    {notif.whatsappEnabled && (
                                        <FormField label="Número de WhatsApp (con código de país)" icon={Phone} value={notif.whatsappNumber} onChange={v => setNotif(p => ({ ...p, whatsappNumber: v }))} placeholder="+57 300 000 0000" />
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── APP MÓVIL ── */}
                        {section === 'app' && (
                            <>
                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Smartphone size={20} style={{ color: 'var(--brand)' }} /> Funcionalidades de la App
                                    </h3>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        Controla qué módulos están disponibles para tu institución en la aplicación móvil SIERCP.
                                    </p>
                                    <div style={{ display: 'grid', gap: 16 }}>
                                        <Toggle value={appCfg.bleEnabled} onChange={v => setAppCfg(p => ({ ...p, bleEnabled: v }))} label="Maniquíes Bluetooth (BLE)" desc="Permite que los instructores conecten maniquíes físicos a las sesiones" />
                                        <div style={{ height: 1, background: 'var(--border)' }} />
                                        <Toggle value={appCfg.sessionRecordingEnabled} onChange={v => setAppCfg(p => ({ ...p, sessionRecordingEnabled: v }))} label="Grabación de sesiones" desc="Guarda las métricas de cada sesión BLE para análisis posterior" />
                                        <div style={{ height: 1, background: 'var(--border)' }} />
                                        <Toggle value={appCfg.certificatesEnabled} onChange={v => setAppCfg(p => ({ ...p, certificatesEnabled: v }))} label="Certificados digitales" desc="Permite emitir y descargar certificados AHA desde la app" />
                                        <div style={{ height: 1, background: 'var(--border)' }} />
                                        <Toggle value={appCfg.paymentsEnabled} onChange={v => setAppCfg(p => ({ ...p, paymentsEnabled: v }))} label="Módulo de pagos" desc="Habilita el cobro de cursos directamente desde la app" />
                                    </div>
                                </div>

                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>Límites operativos</h3>
                                    <div>
                                        <label style={labelSt}>Máximo de sesiones BLE por día</label>
                                        <input style={inputSt} type="number" min="1" max="200" value={appCfg.maxSessionsPerDay} onChange={e => setAppCfg(p => ({ ...p, maxSessionsPerDay: Number(e.target.value) }))} />
                                        <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Número máximo de sesiones con maniquí que se pueden registrar en un día para tu institución</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── SEGURIDAD ── */}
                        {section === 'seguridad' && (
                            <>
                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Lock size={20} style={{ color: '#ef4444' }} /> Políticas de seguridad
                                    </h3>
                                    <div style={{ display: 'grid', gap: 16 }}>
                                        <Toggle value={security.requireStrongPassword} onChange={v => setSecurity(p => ({ ...p, requireStrongPassword: v }))} label="Requerir contraseña segura" desc="Mínimo 8 caracteres, mayúsculas, minúsculas y números" />
                                        <div style={{ height: 1, background: 'var(--border)' }} />
                                        <Toggle value={security.twoFactorEnabled} onChange={v => setSecurity(p => ({ ...p, twoFactorEnabled: v }))} label="Autenticación de dos factores (2FA)" desc="Los usuarios deben verificar su identidad al iniciar sesión (próximamente)" />
                                    </div>
                                </div>

                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Key size={20} style={{ color: '#7c3aed' }} /> Sesiones y acceso
                                    </h3>
                                    <div>
                                        <label style={labelSt}>Tiempo de inactividad antes de cerrar sesión (minutos)</label>
                                        <input style={inputSt} type="number" min="5" max="480" value={security.sessionTimeoutMin} onChange={e => setSecurity(p => ({ ...p, sessionTimeoutMin: Number(e.target.value) }))} />
                                        <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Las sesiones inactivas se cierran automáticamente para proteger los datos de tu institución</p>
                                    </div>
                                    <div style={{ padding: 14, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                                        <div>
                                            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Cambio de contraseña del admin</p>
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Para cambiar tu contraseña, ve a <strong>Perfil → Seguridad</strong> o usa la opción &quot;Olvidé mi contraseña&quot; en el login.</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── BACKUP & DATOS ── */}
                        {section === 'backup' && (
                            <>
                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Download size={20} style={{ color: '#059669' }} /> Exportación de datos
                                    </h3>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        Descarga los datos de tu institución en formato CSV o PDF. Los datos pertenecen exclusivamente a tu institución.
                                    </p>
                                    <div style={{ display: 'grid', gap: 10 }}>
                                        {[
                                            { label: 'Lista de estudiantes', desc: 'Nombre, cédula, email, cursos inscritos', icon: '👥' },
                                            { label: 'Historial de sesiones BLE', desc: 'Métricas de compresión, puntuaciones, fechas', icon: '📊' },
                                            { label: 'Certificados emitidos', desc: 'Estudiante, curso, fecha, código de verificación', icon: '🎓' },
                                            { label: 'Cursos e inscripciones', desc: 'Cursos activos, grupos, inscritos por grupo', icon: '📚' },
                                            { label: 'Instructores asignados', desc: 'Nombre, cédula, cursos asignados, estado', icon: '👨‍🏫' },
                                        ].map(({ label, desc, icon }) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--muted)', borderRadius: 14, gap: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{ fontSize: 22 }}>{icon}</span>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{label}</p>
                                                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>{desc}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => toast.success(`Exportando "${label}" en CSV…`)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}>CSV</button>
                                                    <button onClick={() => toast.success(`Exportando "${label}" en PDF…`)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}>PDF</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={cardSt}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Database size={20} style={{ color: '#7c3aed' }} /> Información de la cuenta
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {[
                                            { label: 'ID de institución', value: user?.institutionId || '—' },
                                            { label: 'Plan activo', value: 'Business' },
                                            { label: 'Almacenamiento usado', value: '—' },
                                            { label: 'Último backup', value: 'Automático (Firebase)' },
                                        ].map(({ label, value }) => (
                                            <div key={label} style={{ padding: '12px 16px', background: 'var(--muted)', borderRadius: 12 }}>
                                                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'monospace' }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                                        Los backups automáticos son gestionados por Firebase. Para solicitar una copia completa de todos tus datos, contacta al soporte de SIERCP.
                                    </p>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

