'use client';

import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { Smartphone, Apple, PlayCircle, ShieldCheck, Bluetooth, UserCheck, Download } from 'lucide-react';

export default function StudentDownloadPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Descargas" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="SIERCP Mobile" 
                    subtitle="Lleva tu entrenamiento clínico a cualquier lugar con nuestra tecnología IoT" 
                    parentTitle="Estudiante"
                    parentHref="/student/home"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, maxWidth: 1200, margin: '0 auto' }}>
                    
                    {/* Main Content Area */}
                    <div>
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 32, padding: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--foreground)', marginBottom: 32 }}>Configuración en 3 Pasos</h3>
                            
                            <div style={{ display: 'grid', gap: 32 }}>
                                <Step icon={Download} title="Descarga e Instala" desc="Obtén la aplicación oficial desde la tienda correspondiente a tu dispositivo móvil." />
                                <Step icon={UserCheck} title="Inicio de Sesión" desc="Utiliza tus mismas credenciales de SIERCP-WEB para sincronizar tu perfil y cursos." />
                                <Step icon={Bluetooth} title="Enlace IoT" desc="Activa el Bluetooth para detectar y vincular automáticamente tu maniquí inteligente." />
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)', margin: '40px 0' }} />

                            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                <DownloadCard 
                                    icon={PlayCircle} 
                                    platform="Android" 
                                    version="v2.4.0" 
                                    color="#10B981" 
                                    href="#"
                                />
                                <DownloadCard 
                                    icon={Apple} 
                                    platform="iOS" 
                                    version="v2.4.0" 
                                    color="var(--foreground)" 
                                    href="#"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32, padding: '0 20px' }}>
                            <ShieldCheck size={20} style={{ color: 'var(--brand)' }} />
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                                Software certificado para cumplimiento de guías AHA 2025. Conexión encriptada de extremo a extremo.
                            </p>
                        </div>
                    </div>

                    {/* Preview / Visual Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--clr-accent) 100%)', borderRadius: 32, padding: 40, color: 'var(--text-on-brand)', position: 'relative', overflow: 'hidden', height: '100%' }}>
                            <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <Smartphone size={48} style={{ marginBottom: 24 }} />
                                <h4 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Control Total en tu Bolsillo</h4>
                                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                                    Visualiza gráficos de profundidad, frecuencia y calidad en tiempo real mientras practicas. Recibe feedback auditivo instantáneo para corregir tu técnica.
                                </p>
                            </div>
                            
                            {/* Simulated Device UI */}
                            <div style={{ marginTop: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                                </div>
                                <div style={{ height: 100, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                                    {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
                                        <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--card)', borderRadius: '4px 4px 0 0', opacity: 0.5 + (i * 0.05) }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function Step({ icon: Icon, title, desc }: any) {
    return (
        <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
                <Icon size={24} />
            </div>
            <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>{title}</h4>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
            </div>
        </div>
    );
}

function DownloadCard({ icon: Icon, platform, version, color, href }: any) {
    return (
        <a 
            href={href}
            style={{ 
                flex: 1, minWidth: 200, padding: '24px', borderRadius: 20, background: 'var(--muted)', border: '1px solid var(--border)', 
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s' 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = 'var(--text-on-brand)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--muted)'; }}
        >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{version}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--foreground)' }}>{platform}</div>
            </div>
        </a>
    );
}
