'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { 
    Settings, Building2, ShieldCheck, Bell, 
    Save, Globe, Lock, Palette, Database,
    Smartphone, Mail, Phone, MapPin
} from 'lucide-react';

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [institution, setInstitution] = useState({
        name: '',
        nit: '',
        city: '',
        phone: '',
        email: '',
        address: ''
    });
    const [aha, setAha] = useState({ minScore: '75', certScore: '85' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user?.institutionId) return;
        const ref = doc(db!, 'institutions', user.institutionId);
        getDoc(ref).then(snap => {
            if (snap.exists()) {
                const d = snap.data();
                setInstitution({
                    name: d.name || '',
                    nit: d.nit || '',
                    city: d.city || '',
                    phone: d.phone || '',
                    email: d.email || '',
                    address: d.address || ''
                });
                if (d.minScore) setAha({ minScore: String(d.minScore), certScore: String(d.certScore || '85') });
            }
        }).catch(console.error);
    }, [user]);

    const handleSave = async () => {
        if (!user?.institutionId || !db) return;
        setSaving(true);
        try {
            const ref = doc(db, 'institutions', user.institutionId);
            await updateDoc(ref, {
                name: institution.name, nit: institution.nit, city: institution.city,
                phone: institution.phone, email: institution.email, address: institution.address,
                minScore: Number(aha.minScore), certScore: Number(aha.certScore),
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error('Error saving settings:', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Configuración del Sistema" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Ajustes Institucionales" 
                    subtitle="Control centralizado de parámetros clínicos, identidad corporativa y notificaciones"
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            style={{ 
                                padding: '12px 24px', borderRadius: 14, background: '#1800AD', color: '#FFFFFF', 
                                border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)',
                                    opacity: saving ? 0.7 : 1
                            }}
                        >
                            <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios Globales'}
                        </button>
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
                    {/* Navigation Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <NavButton icon={Building2} label="Institución" active />
                        <NavButton icon={ShieldCheck} label="Estándares AHA" />
                        <NavButton icon={Bell} label="Notificaciones" />
                        <NavButton icon={Smartphone} label="App Móvil" />
                        <NavButton icon={Lock} label="Seguridad" />
                        <NavButton icon={Database} label="Backup & Datos" />
                    </div>

                    {/* Main Settings Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        
                        {/* Section: Institución */}
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Building2 size={22} style={{ color: '#1800AD' }} /> Identidad Institucional
                            </h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                                <FormGroup label="Nombre Legal" icon={Building2} value={institution.name} onChange={(v: string) => setInstitution({...institution, name: v})} />
                                <FormGroup label="NIT / RUT" icon={FileTextIcon} value={institution.nit} onChange={(v: string) => setInstitution({...institution, nit: v})} />
                                <FormGroup label="Correo Institucional" icon={Mail} value={institution.email} onChange={(v: string) => setInstitution({...institution, email: v})} />
                                <FormGroup label="Teléfono de Contacto" icon={Phone} value={institution.phone} onChange={(v: string) => setInstitution({...institution, phone: v})} />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <FormGroup label="Ciudad" icon={Globe} value={institution.city} onChange={(v: string) => setInstitution({...institution, city: v})} />
                                <FormGroup label="Dirección Física" icon={MapPin} value={institution.address} onChange={(v: string) => setInstitution({...institution, address: v})} />
                            </div>
                        </div>

                        {/* Section: Parámetros AHA */}
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <ShieldCheck size={22} style={{ color: '#10B981' }} /> Estándares de Evaluación
                                    </h3>
                                    <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Define los umbrales mínimos de calidad para aprobación y certificación.</p>
                                </div>
                                <div style={{ background: '#ECFDF5', padding: '6px 12px', borderRadius: 10, color: '#10B981', fontSize: 11, fontWeight: 900 }}>AHA 2025 COMPLIANT</div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 20, border: '1px solid #F1F5F9' }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16 }}>Score Mínimo de Aprobación</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <input type="range" min="0" max="100" value={aha.minScore} onChange={(e) => setAha({...aha, minScore: e.target.value})} style={{ flex: 1, accentColor: '#1800AD' }} />
                                        <span style={{ fontSize: 20, fontWeight: 900, color: '#1800AD', width: 50 }}>{aha.minScore}%</span>
                                    </div>
                                </div>
                                <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 20, border: '1px solid #F1F5F9' }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16 }}>Score Mínimo de Certificación</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <input type="range" min="0" max="100" value={aha.certScore} onChange={(e) => setAha({...aha, certScore: e.target.value})} style={{ flex: 1, accentColor: '#10B981' }} />
                                        <span style={{ fontSize: 20, fontWeight: 900, color: '#10B981', width: 50 }}>{aha.certScore}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function NavButton({ icon: Icon, label, active = false }: any) {
    return (
        <button style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 14,
            background: active ? '#1800AD' : 'transparent', color: active ? '#FFFFFF' : '#64748B',
            border: 'none', fontSize: 14, fontWeight: active ? 800 : 600, cursor: 'pointer',
            textAlign: 'left', transition: 'all 0.2s'
        }}>
            <Icon size={18} /> {label}
        </button>
    );
}

function FormGroup({ label, icon: Icon, value, onChange }: any) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                    <Icon size={18} />
                </div>
                <input 
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    style={{ 
                        width: '100%', height: 48, padding: '0 16px 0 44px', borderRadius: 12, 
                        border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, 
                        color: '#1E293B', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                    }} 
                />
            </div>
        </div>
    );
}

function FileTextIcon({ size, style }: any) {
    return <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
}
