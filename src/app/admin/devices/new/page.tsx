'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import {
    Plus, Save, Cpu, Wifi, MapPin, Tag,
    Hash, Package, Monitor, AlertTriangle
} from 'lucide-react';

export default function NewDevicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        mac: '',
        model: 'SIERCP-MK1',
        location: '',
        status: 'disponible' as string,
        firmwareVersion: '1.0.0',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            setLoading(true);
            if (!db) throw new Error('Firebase not configured');

            const ref = doc(collection(db, 'manikins'));
            await setDoc(ref, {
                ...formData,
                mac: formData.mac.toUpperCase().replace(/[^0-9A-F:]/g, ''),
                lastConnection: null,
                updatedAt: serverTimestamp(),
            });

            router.push('/admin/devices');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al registrar nodo';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Registro de Nodos" />
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero
                        title="Registrar Nuevo Nodo"
                        subtitle="Vinculación de maniquíes IoT a la red SIERCP para monitoreo en tiempo real"
                        parentTitle="Dispositivos"
                        parentHref="/admin/devices"
                    />

                    {error && (
                        <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 32, padding: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'grid', gap: 32 }}>

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Cpu size={20} style={{ color: '#1800AD' }} /> Información del Dispositivo
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Nombre del Nodo" icon={Tag} placeholder="Ej. Maniquí Sala A" required value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
                                    <FormInput label="Dirección MAC" icon={Hash} placeholder="AA:BB:CC:DD:EE:FF" required value={formData.mac} onChange={(v: string) => setFormData({...formData, mac: v})} />
                                    <FormInput label="Modelo" icon={Package} placeholder="SIERCP-MK1" value={formData.model} onChange={(v: string) => setFormData({...formData, model: v})} />
                                    <FormInput label="Versión Firmware" icon={Monitor} placeholder="1.0.0" value={formData.firmwareVersion} onChange={(v: string) => setFormData({...formData, firmwareVersion: v})} />
                                    <FormInput label="Ubicación" icon={MapPin} placeholder="Ej. Laboratorio 201, Sede Principal" value={formData.location} onChange={(v: string) => setFormData({...formData, location: v})} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: '#F1F5F9' }} />

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Wifi size={20} style={{ color: '#1800AD' }} /> Estado Inicial
                                </h3>
                                <div style={{ marginTop: 12 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Estado <span style={{ color: '#EF4444' }}>*</span>
                                    </label>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        {[
                                            { value: 'disponible', label: 'Disponible', color: '#10B981', bg: '#DCFCE7' },
                                            { value: 'mantenimiento', label: 'Mantenimiento', color: '#92400E', bg: '#FEF3C7' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData({...formData, status: opt.value})}
                                                style={{
                                                    flex: 1, padding: '14px 20px', borderRadius: 14,
                                                    border: formData.status === opt.value ? `2px solid ${opt.color}` : '1px solid #E2E8F0',
                                                    background: formData.status === opt.value ? opt.bg : '#F8FAFC',
                                                    color: formData.status === opt.value ? opt.color : '#64748B',
                                                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 2, padding: '16px', borderRadius: 16, background: '#1800AD', color: '#FFFFFF',
                                        border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    <Save size={20} /> {loading ? 'REGISTRANDO...' : 'REGISTRAR NODO'}
                                </button>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function FormInput({ label, icon: Icon, placeholder, required = false, type = "text", value, onChange }: any) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                    <Icon size={18} />
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    style={{
                        width: '100%', height: 52, padding: '0 16px 0 46px', borderRadius: 14,
                        border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 15,
                        color: '#1E293B', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                    }}
                />
            </div>
        </div>
    );
}
