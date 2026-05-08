'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel } from '@/models/course';
import { Save, X, BookOpen, Key, Award, Info, Upload, Users, CheckCircle2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Papa from 'papaparse';

export default function CreateCoursePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [csvStudents, setCsvStudents] = useState<any[]>([]);
    
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        instructorId: user?.uid || '',
        instructorName: user ? `${user.firstName} ${user.lastName}` : '',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        isActive: true,
        certification: 'Certificado de Asistencia',
        minScore: 85,
        moduleCount: 0,
        studentCount: 0,
        completedModules: 0,
        guideIds: [],
        requiredGuideCount: 0,
        scenarioMode: 'completo' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const students = results.data.map((row: any) => ({
                    studentName: row.nombre || row.name || row.Name,
                    studentEmail: row.email || row.correo || row.Email,
                    studentId: Math.random().toString(36).substring(7) // Placeholder ID
                })).filter(s => s.studentName && s.studentEmail);
                
                setCsvStudents(students);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        try {
            setLoading(true);
            const courseId = await CourseService.create({
                ...formData,
                instructorId: user.uid,
                instructorName: `${user.firstName} ${user.lastName}`,
                studentCount: csvStudents.length
            });

            // Enroll CSV students
            if (csvStudents.length > 0) {
                await Promise.all(csvStudents.map(s => 
                    CourseService.enroll(courseId, {
                        ...s,
                        courseId,
                        enrolledAt: new Date(),
                        avgScore: 0,
                        completedModules: 0
                    })
                ));
            }

            router.push(`/instructor/courses/${courseId}`);
        } catch (error) {
            console.error('Error creating course:', error);
            alert('Error al crear el curso');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Crear Nuevo Curso" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#1800AD', letterSpacing: '0.1em', marginBottom: 6 }}>NUEVO PROGRAMA</div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: 0 }}>Configurar Capacitación</h1>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, alignItems: 'start' }}>
                        
                        <div style={{ display: 'grid', gap: 24 }}>
                            {/* Información General */}
                            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                                        <Info size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Detalles del Curso</h3>
                                </div>

                                <div style={{ display: 'grid', gap: 20 }}>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Título del Programa</label>
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej. Soporte Vital Avanzado 2026"
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15 }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Descripción Pedagógica</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            placeholder="Define los objetivos y competencias a desarrollar..."
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', fontSize: 15, resize: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Carga Masiva de Estudiantes */}
                            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                        <Users size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Inscripción de Alumnos</h3>
                                </div>

                                <div style={{ border: '2px dashed #E2E8F0', borderRadius: 20, padding: 32, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                                    <input 
                                        type="file" 
                                        accept=".csv" 
                                        onChange={handleCsvUpload}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                    />
                                    <div style={{ color: '#6366F1', marginBottom: 12 }}>
                                        <Upload size={40} style={{ margin: '0 auto' }} />
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Cargar archivo CSV</div>
                                    <div style={{ fontSize: 13, color: '#64748B' }}>Arrastra un archivo con columnas 'nombre' y 'email'</div>
                                </div>

                                {csvStudents.length > 0 && (
                                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F0FDF4', borderRadius: 12, color: '#166534', fontSize: 14, fontWeight: 600 }}>
                                        <CheckCircle2 size={18} /> {csvStudents.length} estudiantes listos para inscripción
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 24 }}>
                            {/* Invite Code & QR */}
                            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, textAlign: 'left' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                                        <Key size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Código de Acceso</h3>
                                </div>

                                <div style={{ background: '#F8FAFC', borderRadius: 20, padding: 24, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#1800AD', letterSpacing: '0.2em', marginBottom: 20 }}>{formData.inviteCode}</div>
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: 16, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
                                        <QRCodeSVG value={formData.inviteCode} size={150} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>Los estudiantes pueden usar este código o escanear el QR desde la App SIERCP para unirse.</div>
                            </div>

                            {/* Certificación */}
                            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DB2777' }}>
                                        <Award size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Certificación</h3>
                                </div>
                                <select
                                    name="certification"
                                    value={formData.certification}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 15, outline: 'none', background: '#FFFFFF' }}
                                >
                                    <option value="Certificado de Asistencia">Solo Asistencia</option>
                                    <option value="Certificado de Aprobación">Aprobación (Min. 85%)</option>
                                    <option value="Diplomado Técnico">Diplomado Técnico</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '18px', borderRadius: 16,
                                    background: '#1800AD', color: '#FFFFFF', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                                    opacity: loading ? 0.7 : 1, boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.4)'
                                }}
                            >
                                <Save size={20} /> {loading ? 'CREANDO...' : 'PUBLICAR CURSO'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
