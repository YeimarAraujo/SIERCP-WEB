'use client';

import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { Award, Search, Download, CheckCircle, FileText } from 'lucide-react';
import { useState } from 'react';

export default function InstructorCertificatesPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Certificaciones" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Control de Certificados" 
                    subtitle="Validación y emisión de credenciales para estudiantes con alto desempeño"
                    parentTitle="Instructor"
                    parentHref="/instructor/dashboard"
                />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 40, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD', margin: '0 auto 24px auto' }}>
                        <Award size={40} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Emisión de Credenciales SIERCP</h3>
                    <p style={{ color: '#64748B', fontSize: 15, maxWidth: 500, margin: '0 auto 32px auto' }}>
                        Aquí podrás gestionar los certificados generados automáticamente para los alumnos que superen el 85% de calidad en sus simulaciones AHA 2025.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, textAlign: 'left' }}>
                        <CertificateTemplate title="Certificado RCP Básico" students={12} code="BLS-2024" />
                        <CertificateTemplate title="Certificado RCP Avanzado" students={5} code="ACLS-2024" />
                        <CertificateTemplate title="Acreditación de Escenario" students={28} code="SCN-GEN" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function CertificateTemplate({ title, students, code }: any) {
    return (
        <div style={{ padding: 24, borderRadius: 20, background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                    <CheckCircle size={22} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Código: {code}</div>
            </div>
            <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{title}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>{students} alumnos certificados</p>
            </div>
            <button style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#1800AD', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FileText size={16} /> Ver Listado
            </button>
        </div>
    );
}
