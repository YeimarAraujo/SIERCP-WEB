'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/shared/lib/firebase';
import {
    Upload, FileText, Download, AlertTriangle,
    CheckCircle, X, ArrowLeft, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ImportStudentsPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
            setFile(f);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
    };

    const parseCSV = (text: string): string[][] => {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return [];
        return lines.slice(1).map(line => {
            const row: string[] = [];
            let current = '';
            let inQuotes = false;
            for (const ch of line) {
                if (ch === '"') { inQuotes = !inQuotes; continue; }
                if (ch === ',' && !inQuotes) { row.push(current.trim()); current = ''; continue; }
                current += ch;
            }
            row.push(current.trim());
            return row;
        });
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);
        const errors: string[] = [];
        let success = 0;

        try {
            const text = await file.text();
            const rows = parseCSV(text);

            for (let i = 0; i < rows.length; i++) {
                const cols = rows[i];
                try {
                    const [nombres, apellidos, email, identificacion] = cols;
                    if (!email) { errors.push(`Fila ${i + 2}: email requerido`); continue; }

                    const password = Math.random().toString(36).slice(2, 10) + 'A1!';
                    const cred = await createUserWithEmailAndPassword(auth!, email, password);
                    await setDoc(doc(db!, 'users', cred.user.uid), {
                        uid: cred.user.uid, email,
                        firstName: nombres || '', lastName: apellidos || '',
                        role: 'ESTUDIANTE', identificacion: identificacion || '',
                        isActive: true, institutionId: 'SIERCP-GENERAL',
                        status: 'ACTIVE',
                        stats: { totalSessions: 0, sessionsToday: 0, averageScore: 0, bestScore: 0, streakDays: 0, totalHours: 0, averageDepthMm: 0, averageRatePerMin: 0 },
                        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
                    });
                    success++;
                } catch (e: any) {
                    errors.push(`Fila ${i + 2}: ${e.message}`);
                }
            }
        } catch (e: any) {
            errors.push(`Error de archivo: ${e.message}`);
            toast.error('Error al procesar el archivo');
        }

        setResult({ success, errors });
        setLoading(false);
        toast.success(`Importación completada: ${success} estudiantes registrados`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Importar Estudiantes" />
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>

                    <button
                        onClick={() => router.back()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#64748B', fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontSize: 13 }}
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>

                    <PageHero
                        title="Importación Masiva"
                        subtitle="Cargue de expedientes estudiantiles desde archivo CSV o Excel"
                        parentTitle="Alumnos"
                        parentHref="/admin/students"
                    />

                    {result ? (
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 32, padding: 48, textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <CheckCircle size={32} style={{ color: '#16A34A' }} />
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Importación Completada</h2>
                            <p style={{ fontSize: 15, color: '#64748B', marginBottom: 24 }}>
                                Se registraron <strong style={{ color: '#16A34A' }}>{result.success}</strong> estudiantes exitosamente.
                            </p>
                            {result.errors.length > 0 && (
                                <div style={{ textAlign: 'left', marginBottom: 24, padding: 16, background: '#FEF2F2', borderRadius: 12 }}>
                                    <p style={{ fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>{result.errors.length} errores:</p>
                                    {result.errors.map((e, i) => <p key={i} style={{ fontSize: 13, color: '#DC2626' }}>{e}</p>)}
                                </div>
                            )}
                            <button
                                onClick={() => router.push('/admin/students')}
                                style={{ padding: '14px 32px', borderRadius: 14, background: '#1800AD', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Ir a Directorio de Alumnos
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 32, padding: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'grid', gap: 32 }}>

                                <div>
                                    <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Upload size={20} style={{ color: '#1800AD' }} /> Seleccionar Archivo
                                    </h3>
                                    <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                                        Formatos aceptados: <strong>.csv</strong>, <strong>.xlsx</strong>. Descarga la plantilla modelo para asegurar la estructura correcta.
                                    </p>

                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            border: `2px dashed ${dragOver ? '#1800AD' : file ? '#10B981' : '#E2E8F0'}`,
                                            borderRadius: 20, padding: 48, textAlign: 'center', cursor: 'pointer',
                                            background: dragOver ? '#F5F3FF' : file ? '#F0FDF4' : '#FAFAFA',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv,.xlsx"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                        {file ? (
                                            <div>
                                                <FileText size={40} style={{ color: '#1800AD', marginBottom: 12 }} />
                                                <p style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>{file.name}</p>
                                                <p style={{ fontSize: 12, color: '#64748B' }}>{(file.size / 1024).toFixed(1)} KB</p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                    style={{ marginTop: 12, background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <X size={14} /> Eliminar archivo
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload size={40} style={{ color: '#94A3B8', marginBottom: 12 }} />
                                                <p style={{ fontWeight: 700, color: '#475569', fontSize: 15 }}>
                                                    Arrastra el archivo aquí o <span style={{ color: '#1800AD' }}>haz clic para seleccionar</span>
                                                </p>
                                                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>CSV o Excel con datos de estudiantes</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ padding: 16, background: '#F0F9FF', borderRadius: 14, border: '1px solid #B9E6FE', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <AlertTriangle size={20} style={{ color: '#0369A1', flexShrink: 0, marginTop: 2 }} />
                                    <div style={{ fontSize: 12, color: '#0369A1', fontWeight: 600 }}>
                                        <p style={{ marginBottom: 4 }}>El archivo debe contener las columnas: <strong>nombres, apellidos, email, identificacion</strong>.</p>
                                        <p>Los estudiantes recibirán un correo con sus credenciales de acceso tras la importación.</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 16 }}>
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!file || loading}
                                        style={{
                                            flex: 2, padding: '16px', borderRadius: 16, background: '#1800AD', color: '#FFFFFF',
                                            border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                            boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)',
                                            opacity: !file || loading ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                        {loading ? 'IMPORTANDO...' : 'INICIAR IMPORTACIÓN'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
