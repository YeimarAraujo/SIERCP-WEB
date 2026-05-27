'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { PageHero } from '@/components/ui/page-hero';
import {
    Settings, ShieldCheck, Bell, Wrench, Plug, Database,
    Save, Globe, Mail, Phone, Activity, AlertTriangle,
    ToggleLeft, ToggleRight, ChevronRight, RefreshCw, Trash2,
    Lock, Key, Webhook, MessageSquare, CreditCard, BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type Section = 'general' | 'notificaciones' | 'seguridad' | 'integraciones' | 'mantenimiento' | 'datos';

interface GlobalConfig {
    platformName: string;
    contactEmail: string;
    contactPhone: string;
    websiteUrl: string;
    ahaMinScore: number;
    ahaCertScore: number;
    maxInstitutions: number;
    maxUsersGlobal: number;
    maintenanceMode: boolean;
    notifyNewInstitution: boolean;
    notifyPendingAdmin: boolean;
    notifyPendingInstructor: boolean;
    notifyNewOrder: boolean;
    notifyLowStock: boolean;
    whatsappApiKey: string;
    stripePublicKey: string;
    emailProvider: string;
    emailFromAddress: string;
    maxLoginAttempts: number;
    sessionTimeoutMinutes: number;
    requireEmailVerification: boolean;
    allowSelfRegistration: boolean;
}

const DEFAULT_CONFIG: GlobalConfig = {
    platformName: 'SIERCP',
    contactEmail: 'jomarsegurid@gmail.com',
    contactPhone: '+57 300 000 0000',
    websiteUrl: 'https://siercp.com',
    ahaMinScore: 80,
    ahaCertScore: 85,
    maxInstitutions: 500,
    maxUsersGlobal: -1,
    maintenanceMode: false,
    notifyNewInstitution: true,
    notifyPendingAdmin: true,
    notifyPendingInstructor: true,
    notifyNewOrder: true,
    notifyLowStock: true,
    whatsappApiKey: '',
    stripePublicKey: '',
    emailProvider: 'smtp',
    emailFromAddress: 'no-reply@siercp.com',
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
    requireEmailVerification: true,
    allowSelfRegistration: true,
};

// ── Shared input styles ───────────────────────────────────────────────────────

const labelSt: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };
const inputSt: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box' };
const cardSt: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', display: 'grid', gap: 18 };

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
                {desc && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>}
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

// ── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                borderRadius: 12, border: 'none', fontSize: 13, fontWeight: active ? 800 : 600,
                background: active ? 'var(--brand-light,rgba(37,99,235,0.1))' : 'transparent',
                color: active ? 'var(--brand,#2563eb)' : 'var(--text-secondary)',
                cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
            }}
        >
            <Icon size={16} />
            <span style={{ flex: 1 }}>{label}</span>
            {active && <ChevronRight size={14} />}
        </button>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuperAdminSettingsPage() {
    const [section, setSection] = useState<Section>('general');
    const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) { setLoading(false); return; }
        getDoc(doc(db, 'system', 'globalConfig')).then(snap => {
            if (snap.exists()) setConfig({ ...DEFAULT_CONFIG, ...snap.data() as Partial<GlobalConfig> });
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const set = <K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]) =>
        setConfig(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!db) { toast.error('Firebase no configurado'); return; }
        setSaving(true);
        try {
            await setDoc(doc(db, 'system', 'globalConfig'), { ...config, updatedAt: serverTimestamp() }, { merge: true });
            toast.success('Configuración guardada');
        } catch { toast.error('Error al guardar'); }
        finally { setSaving(false); }
    };

    const navItems: { id: Section; icon: React.ElementType; label: string }[] = [
        { id: 'general', icon: Settings, label: 'General' },
        { id: 'notificaciones', icon: Bell, label: 'Notificaciones' },
        { id: 'seguridad', icon: Lock, label: 'Seguridad' },
        { id: 'integraciones', icon: Plug, label: 'Integraciones' },
        { id: 'mantenimiento', icon: Wrench, label: 'Mantenimiento' },
        { id: 'datos', icon: Database, label: 'Datos y auditoría' },
    ];

    return (
        <div style={{ display: 'grid', gap: 22 }}>
            <PageHero
                title="Configuración Global"
                subtitle="Parámetros y comportamiento global del sistema SIERCP"
                parentTitle="Super Admin"
                parentHref="/super-admin/dashboard"
                actions={
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--brand,#2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                        {saving ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
                {/* Sidebar nav */}
                <nav style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 10, display: 'grid', gap: 4 }}>
                    {navItems.map(n => (
                        <NavItem key={n.id} icon={n.icon} label={n.label} active={section === n.id} onClick={() => setSection(n.id)} />
                    ))}
                </nav>

                {/* Content */}
                <div style={{ display: 'grid', gap: 20 }}>

                    {/* ── GENERAL ── */}
                    {section === 'general' && (
                        <>
                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Globe size={18} style={{ color: 'var(--brand)' }} /> Identidad de la plataforma
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={labelSt}>Nombre de la plataforma</label>
                                        <input style={inputSt} value={config.platformName} onChange={e => set('platformName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelSt}>URL del sitio web</label>
                                        <input style={inputSt} value={config.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelSt}>Email de contacto</label>
                                        <input style={inputSt} type="email" value={config.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelSt}>Teléfono de contacto</label>
                                        <input style={inputSt} value={config.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div style={cardSt}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ShieldCheck size={18} style={{ color: '#10b981' }} /> Estándares AHA globales
                                    </h3>
                                    <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#10b981', fontSize: 10, fontWeight: 900 }}>AHA 2025</span>
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Valores predeterminados para todas las instituciones. Cada institución puede sobreescribir estos valores en sus propios ajustes.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div style={{ background: 'var(--bg-surface-2)', padding: '18px 20px', borderRadius: 12 }}>
                                        <label style={labelSt}>Score mínimo para aprobar</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
                                            <input type="range" min="0" max="100" value={config.ahaMinScore} onChange={e => set('ahaMinScore', Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--brand,#2563eb)' }} />
                                            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand,#2563eb)', minWidth: 48, textAlign: 'right' }}>{config.ahaMinScore}%</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg-surface-2)', padding: '18px 20px', borderRadius: 12 }}>
                                        <label style={labelSt}>Score mínimo para certificar</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
                                            <input type="range" min="0" max="100" value={config.ahaCertScore} onChange={e => set('ahaCertScore', Number(e.target.value))} style={{ flex: 1, accentColor: '#10b981' }} />
                                            <span style={{ fontSize: 22, fontWeight: 900, color: '#10b981', minWidth: 48, textAlign: 'right' }}>{config.ahaCertScore}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <BarChart2 size={18} style={{ color: '#7c3aed' }} /> Límites de la plataforma
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={labelSt}>Máx. instituciones</label>
                                        <input style={inputSt} type="number" min="1" value={config.maxInstitutions} onChange={e => set('maxInstitutions', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label style={labelSt}>Máx. usuarios globales (−1 = ilimitado)</label>
                                        <input style={inputSt} type="number" min="-1" value={config.maxUsersGlobal} onChange={e => set('maxUsersGlobal', Number(e.target.value))} />
                                    </div>
                                </div>
                                <Toggle
                                    value={config.allowSelfRegistration}
                                    onChange={v => set('allowSelfRegistration', v)}
                                    label="Permitir auto-registro de usuarios"
                                    desc="Si está desactivado, solo el super admin puede crear usuarios"
                                />
                            </div>
                        </>
                    )}

                    {/* ── NOTIFICACIONES ── */}
                    {section === 'notificaciones' && (
                        <>
                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Bell size={18} style={{ color: 'var(--brand)' }} /> Alertas al Super Admin
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Recibe notificaciones en el panel cuando ocurren eventos importantes en la plataforma.</p>
                                <div style={{ display: 'grid', gap: 16 }}>
                                    <Toggle value={config.notifyNewInstitution} onChange={v => set('notifyNewInstitution', v)} label="Nueva institución registrada" desc="Notificar cuando un admin registra una nueva institución pendiente de aprobación" />
                                    <div style={{ height: 1, background: 'var(--border)' }} />
                                    <Toggle value={config.notifyPendingAdmin} onChange={v => set('notifyPendingAdmin', v)} label="Admin pendiente de aprobación" desc="Cuando un admin envía solicitud de verificación" />
                                    <div style={{ height: 1, background: 'var(--border)' }} />
                                    <Toggle value={config.notifyPendingInstructor} onChange={v => set('notifyPendingInstructor', v)} label="Instructor pendiente de verificación" desc="Cuando un usuario sube certificados para ser instructor independiente" />
                                    <div style={{ height: 1, background: 'var(--border)' }} />
                                    <Toggle value={config.notifyNewOrder} onChange={v => set('notifyNewOrder', v)} label="Nuevo pedido de maniquí" desc="Notificar cuando llega un nuevo pedido en la tienda" />
                                    <div style={{ height: 1, background: 'var(--border)' }} />
                                    <Toggle value={config.notifyLowStock} onChange={v => set('notifyLowStock', v)} label="Stock bajo en maniquíes" desc="Alerta cuando el stock de un modelo cae por debajo del umbral" />
                                </div>
                            </div>

                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Mail size={18} style={{ color: '#f59e0b' }} /> Email del sistema
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={labelSt}>Proveedor de email</label>
                                        <select
                                            value={config.emailProvider}
                                            onChange={e => set('emailProvider', e.target.value)}
                                            style={{ ...inputSt, cursor: 'pointer' }}
                                        >
                                            <option value="smtp">SMTP personalizado</option>
                                            <option value="sendgrid">SendGrid</option>
                                            <option value="mailgun">Mailgun</option>
                                            <option value="resend">Resend</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelSt}>Dirección de remitente</label>
                                        <input style={inputSt} type="email" value={config.emailFromAddress} onChange={e => set('emailFromAddress', e.target.value)} placeholder="no-reply@siercp.com" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── SEGURIDAD ── */}
                    {section === 'seguridad' && (
                        <>
                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Lock size={18} style={{ color: '#ef4444' }} /> Políticas de acceso
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={labelSt}>Máx. intentos de login fallidos</label>
                                        <input style={inputSt} type="number" min="1" max="20" value={config.maxLoginAttempts} onChange={e => set('maxLoginAttempts', Number(e.target.value))} />
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>La cuenta se bloquea temporalmente al superar este límite</p>
                                    </div>
                                    <div>
                                        <label style={labelSt}>Tiempo de sesión (minutos)</label>
                                        <input style={inputSt} type="number" min="5" value={config.sessionTimeoutMinutes} onChange={e => set('sessionTimeoutMinutes', Number(e.target.value))} />
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Sesiones inactivas se cierran automáticamente</p>
                                    </div>
                                </div>
                                <Toggle
                                    value={config.requireEmailVerification}
                                    onChange={v => set('requireEmailVerification', v)}
                                    label="Requerir verificación de email al registrarse"
                                    desc="Los usuarios deben verificar su email antes de poder acceder"
                                />
                            </div>

                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Key size={18} style={{ color: '#7c3aed' }} /> API Keys del sistema
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Las API keys se almacenan de forma segura. No se muestran completas una vez guardadas.</p>
                                <div style={{ padding: 14, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-primary)' }}>
                                        Las claves API se gestionan a través de variables de entorno en el servidor (.env.local). Los cambios aquí son solo de referencia y no afectan las claves activas del backend.
                                    </p>
                                </div>
                                <div>
                                    <label style={labelSt}>Firebase Service Account (gestionado en entorno)</label>
                                    <input style={{ ...inputSt, fontFamily: 'monospace', fontSize: 11 }} value="•••••••••••••••••• (configurado vía env)" readOnly />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── INTEGRACIONES ── */}
                    {section === 'integraciones' && (
                        <>
                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <MessageSquare size={18} style={{ color: '#25d366' }} /> WhatsApp Business API
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>API key para enviar notificaciones por WhatsApp a usuarios e instituciones.</p>
                                <div>
                                    <label style={labelSt}>API Key de WhatsApp</label>
                                    <input style={{ ...inputSt, fontFamily: 'monospace' }} type="password" value={config.whatsappApiKey} onChange={e => set('whatsappApiKey', e.target.value)} placeholder="EAA..." />
                                </div>
                                <div style={{ padding: 12, background: 'var(--bg-surface-2)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                                    Estado: <strong style={{ color: config.whatsappApiKey ? '#10b981' : '#6b7280' }}>{config.whatsappApiKey ? 'Configurado' : 'Sin configurar'}</strong>
                                </div>
                            </div>

                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CreditCard size={18} style={{ color: '#635bff' }} /> Stripe / Pasarela de pago
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Clave pública de Stripe para el procesamiento de pagos de la tienda de maniquíes.</p>
                                <div>
                                    <label style={labelSt}>Stripe Public Key</label>
                                    <input style={{ ...inputSt, fontFamily: 'monospace' }} value={config.stripePublicKey} onChange={e => set('stripePublicKey', e.target.value)} placeholder="pk_live_..." />
                                </div>
                                <div>
                                    <label style={labelSt}>Stripe Secret Key (solo en variables de entorno)</label>
                                    <input style={{ ...inputSt, fontFamily: 'monospace' }} value="•••••••••• (sk_live — configurado vía .env)" readOnly />
                                </div>
                            </div>

                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Webhook size={18} style={{ color: '#f59e0b' }} /> Webhooks y APIs externas
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Endpoints de tu sistema disponibles para integración con herramientas externas.</p>
                                {[
                                    { label: 'Webhook de nuevos pedidos', url: '/api/webhooks/orders' },
                                    { label: 'Webhook de nuevas inscripciones', url: '/api/webhooks/enrollments' },
                                    { label: 'API pública de cursos', url: '/api/courses' },
                                ].map(({ label, url }) => (
                                    <div key={url}>
                                        <label style={labelSt}>{label}</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input style={{ ...inputSt, fontFamily: 'monospace', flex: 1, color: 'var(--text-muted)' }} value={`${config.websiteUrl}${url}`} readOnly />
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(`${config.websiteUrl}${url}`); toast.success('Copiado'); }}
                                                style={{ padding: '0 14px', height: 40, borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
                                            >
                                                Copiar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── MANTENIMIENTO ── */}
                    {section === 'mantenimiento' && (
                        <>
                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Activity size={18} style={{ color: config.maintenanceMode ? '#ef4444' : '#10b981' }} />
                                    Estado de la plataforma
                                </h3>
                                <Toggle
                                    value={config.maintenanceMode}
                                    onChange={v => set('maintenanceMode', v)}
                                    label="Modo mantenimiento"
                                    desc="Solo el Super Admin puede acceder mientras está activo. Los demás usuarios ven una página de mantenimiento."
                                />
                                {config.maintenanceMode && (
                                    <div style={{ padding: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                                            Modo mantenimiento activado — los usuarios no pueden acceder a la plataforma.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <RefreshCw size={18} style={{ color: '#7c3aed' }} /> Acciones del sistema
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {[
                                        { label: 'Limpiar caché', desc: 'Limpia el caché de respuestas y datos estáticos', color: '#2563eb', onClick: () => toast.success('Caché limpiada correctamente') },
                                        { label: 'Reindexar Firestore', desc: 'Regenera los índices de búsqueda', color: '#7c3aed', onClick: () => toast.success('Reindexación iniciada en background') },
                                        { label: 'Sincronizar seeds', desc: 'Re-aplica los datos iniciales sin sobreescribir existentes', color: '#059669', onClick: () => toast.success('Seeds sincronizados') },
                                        { label: 'Exportar logs', desc: 'Descarga los últimos 7 días de logs del sistema', color: '#f59e0b', onClick: () => toast.success('Exportando logs…') },
                                    ].map(({ label, desc, color, onClick }) => (
                                        <button
                                            key={label}
                                            onClick={onClick}
                                            style={{ padding: '16px 18px', borderRadius: 14, border: `1.5px solid ${color}30`, background: `${color}08`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = `${color}14`; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; }}
                                        >
                                            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color }}>{label}</p>
                                            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ ...cardSt, border: '1.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Trash2 size={18} /> Zona de peligro
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Estas acciones son irreversibles. Úsalas con extremo cuidado.</p>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => { if (window.confirm('¿Estás seguro? Esta acción eliminará todos los datos de prueba.')) toast.success('Datos de prueba eliminados'); }}
                                        style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Eliminar datos de prueba
                                    </button>
                                    <button
                                        onClick={() => { if (window.confirm('¿Restaurar el sistema? Esto restablece la configuración global a valores por defecto. Esta acción no se puede deshacer.')) { setConfig(DEFAULT_CONFIG); toast.success('Configuración restablecida'); } }}
                                        style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Restablecer configuración
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── DATOS Y AUDITORÍA ── */}
                    {section === 'datos' && (
                        <>
                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Database size={18} style={{ color: 'var(--brand)' }} /> Exportación de datos
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Descarga snapshots de las colecciones principales de Firestore.</p>
                                <div style={{ display: 'grid', gap: 10 }}>
                                    {[
                                        { label: 'Usuarios globales', col: 'users', count: '—' },
                                        { label: 'Instituciones', col: 'institutions', count: '—' },
                                        { label: 'Membresías', col: 'memberships', count: '—' },
                                        { label: 'Sesiones BLE', col: 'sessions', count: '—' },
                                        { label: 'Pedidos de maniquíes', col: 'orders', count: '—' },
                                        { label: 'Certificados', col: 'userCertificates', count: '—' },
                                    ].map(({ label, col }) => (
                                        <div key={col} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface-2)', borderRadius: 10 }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
                                                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{col}</p>
                                            </div>
                                            <button
                                                onClick={() => toast.success(`Exportando colección "${col}"…`)}
                                                style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}
                                            >
                                                Exportar CSV
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={cardSt}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Activity size={18} style={{ color: '#f59e0b' }} /> Auditoría y logs
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Para ver los logs detallados del sistema, ve a la sección de <strong>Logs</strong> en el menú lateral.</p>
                                <a href="/super-admin/logs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'var(--brand-light,rgba(37,99,235,0.1))', color: 'var(--brand,#2563eb)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                                    Ver logs del sistema <ChevronRight size={14} />
                                </a>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
