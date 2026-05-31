'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import { Save, Key, Award, Info, Upload, Users, CheckCircle2, Plus, Layers } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { isAdmin } from '@/models/user';
import { ModuleFormCard, DEFAULT_MODULE, type ModuleForm } from '@/components/course/module-form-card';

export default function CreateCoursePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [csvStudents, setCsvStudents] = useState<any[]>([]);
    const [memberships, setMemberships] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [modules, setModules] = useState<ModuleForm[]>([
        { ...DEFAULT_MODULE, order: 1 },
    ]);

    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        institutionId: user?.institutionId || '',
        institutionName: '',
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

    const addModule = () => {
        setModules(prev => [...prev, { ...DEFAULT_MODULE, order: prev.length + 1 }]);
    };

    const handleModuleChange = (idx: number, updated: ModuleForm) => {
        setModules(prev => prev.map((m, i) => i === idx ? updated : m));
    };

    const removeModule = (idx: number) => {
        setModules(prev => prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i + 1 })));
    };

    useEffect(() => {
        if (user) {
            const fetchMemberships = async () => {
                try {
                    const q = query(collection(db, 'memberships'), where('userId', '==', user.uid), where('status', '==', 'approved'));
                    const snaps = await getDocs(q);
                    const mems = snaps.docs.map(d => d.data());
                    setMemberships(mems);
                    if (mems.length === 1) {
                        setFormData((prev: any) => ({ ...prev, institutionId: mems[0].institutionId, institutionName: mems[0].institutionName || '' }));
                    } else if (mems.length === 0 && user.institutionId) {
                        setFormData((prev: any) => ({ ...prev, institutionId: user.institutionId }));
                    }
                } catch (e) {
                    console.error('Error fetching memberships', e);
                }
            };
            fetchMemberships();
        }
    }, [user]);

    useEffect(() => {
        if (isAdmin(user) && formData.institutionId) {
            const fetchInstructors = async () => {
                try {
                    const q = query(collection(db, 'memberships'), where('institutionId', '==', formData.institutionId), where('role', '==', 'INSTRUCTOR'), where('isActive', '==', true));
                    const snaps = await getDocs(q);
                    const insts = snaps.docs.map(d => ({
                        id: d.data().userId,
                        name: d.data().userName || d.data().userEmail || 'Instructor'
                    }));
                    if (!insts.find(i => i.id === user?.uid)) {
                        insts.unshift({ id: user?.uid, name: `${user?.firstName} ${user?.lastName}` });
                    }
                    setInstructors(insts);
                } catch (e) {
                    console.error('Error fetching instructors', e);
                }
            };
            fetchInstructors();
        }
    }, [formData.institutionId, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        if (name === 'institutionId') {
            const mem = memberships.find(m => m.institutionId === value);
            setFormData((prev: any) => ({
                ...prev,
                institutionId: value,
                institutionName: mem?.institutionName || ''
            }));
        } else if (name === 'instructorId') {
            const inst = instructors.find(i => i.id === value);
            setFormData((prev: any) => ({
                ...prev,
                instructorId: value,
                instructorName: inst?.name || ''
            }));
        } else {
            setFormData((prev: any) => ({
                ...prev,
                [name]: type === 'number' ? Number(value) : value
            }));
        }
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
                    studentId: Math.random().toString(36).substring(7)
                })).filter((s: any) => s.studentName && s.studentEmail);
                setCsvStudents(students);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);
            const validModules = modules
                .filter(m => m.title.trim())
                .map(m => ({ ...m, topics: m.topics.filter(Boolean) }));

            const courseId = await CourseService.create({
                ...formData,
                modules: validModules,
                moduleCount: validModules.length || formData.moduleCount,
                createdBy: user.uid,
                studentCount: csvStudents.length
            });

            if (csvStudents.length > 0) {
                await Promise.all(csvStudents.map((s: any) =>
                    CourseService.enroll(courseId, {
                        ...s,
                        courseId,
                        enrolledAt: new Date(),
                        avgScore: 0,
                        completedModules: 0
                    })
                ));
            }

            toast.success('Curso creado exitosamente');
            router.push(`/instructor/courses/${courseId}`);
        } catch (error) {
            console.error('Error creating course:', error);
            toast.error('Error al crear el curso');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '14px 16px', borderRadius: 12,
        border: '1px solid var(--border)', outline: 'none', fontSize: 15,
        background: 'var(--card)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Crear Nuevo Curso" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.1em', marginBottom: 6 }}>NUEVO PROGRAMA</div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--foreground)', margin: 0 }}>Configurar Capacitación</h1>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, alignItems: 'start' }}>

                        <div style={{ display: 'grid', gap: 24 }}>
                            {/* Información General */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-accent)' }}>
                                        <Info size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Detalles del Curso</h3>
                                </div>

                                <div style={{ display: 'grid', gap: 20 }}>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Institución *</label>
                                        <select
                                            name="institutionId"
                                            value={formData.institutionId}
                                            onChange={handleChange}
                                            required
                                            style={inputStyle}
                                        >
                                            <option value="">Seleccione una institución...</option>
                                            {memberships.map(m => (
                                                <option key={m.institutionId} value={m.institutionId}>
                                                    {m.institutionName || m.institutionId}
                                                </option>
                                            ))}
                                            {memberships.length === 0 && user?.institutionId && (
                                                <option value={user.institutionId}>Mi Institución Principal</option>
                                            )}
                                        </select>
                                    </div>

                                    {isAdmin(user) && formData.institutionId && (
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Instructor Asignado *</label>
                                            <select
                                                name="instructorId"
                                                value={formData.instructorId}
                                                onChange={handleChange}
                                                required
                                                style={inputStyle}
                                            >
                                                <option value="">Seleccione un instructor...</option>
                                                {instructors.map(i => (
                                                    <option key={i.id} value={i.id}>
                                                        {i.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Título del Programa</label>
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej. Soporte Vital Avanzado 2026"
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Descripción Pedagógica</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            placeholder="Define los objetivos y competencias a desarrollar..."
                                            style={{ ...inputStyle, resize: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Módulos del Curso */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                                        <Layers size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Plan de Estudios (Módulos)</h3>
                                </div>

                                {modules.map((mod, mIdx) => (
                                    <ModuleFormCard
                                        key={mIdx}
                                        module={mod}
                                        index={mIdx}
                                        showRemove={modules.length > 1}
                                        onChange={handleModuleChange}
                                        onRemove={removeModule}
                                    />
                                ))}

                                <button type="button" onClick={addModule} style={{
                                    width: '100%', padding: '13px', borderRadius: 12, border: '2px dashed var(--border)',
                                    background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}>
                                    <Plus size={16} /> Agregar Módulo
                                </button>
                            </div>

                            {/* Carga Masiva de Estudiantes */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                        <Users size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Inscripción de Alumnos</h3>
                                </div>

                                <div style={{ border: '2px dashed var(--border)', borderRadius: 20, padding: 32, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCsvUpload}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                    />
                                    <div style={{ color: 'var(--clr-accent)', marginBottom: 12 }}>
                                        <Upload size={40} style={{ margin: '0 auto' }} />
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>Cargar archivo CSV</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Arrastra un archivo con columnas 'nombre' y 'email'</div>
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
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, textAlign: 'left' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                                        <Key size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Código de Acceso</h3>
                                </div>

                                <div style={{ background: 'var(--muted)', borderRadius: 20, padding: 24, border: '1px solid var(--border)', marginBottom: 20 }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--brand)', letterSpacing: '0.2em', marginBottom: 20 }}>{formData.inviteCode}</div>
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: 16, background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                        <QRCodeSVG value={formData.inviteCode} size={150} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Los estudiantes pueden usar este código o escanear el QR desde la App SIERCP para unirse.</div>
                            </div>

                            {/* Certificación */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DB2777' }}>
                                        <Award size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Certificación</h3>
                                </div>
                                <select
                                    name="certification"
                                    value={formData.certification}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 15, outline: 'none', background: 'var(--card)' }}
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
                                    background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer',
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
