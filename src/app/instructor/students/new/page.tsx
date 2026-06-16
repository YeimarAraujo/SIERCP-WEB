'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, getSecondaryAuth } from '@/shared/lib/firebase';
import { UserService, CourseService } from '@/services/firestore.service';
import { useAuth } from '@/hooks/use-auth';
import { getFullName } from '@/models/user';
import type { UserModel } from '@/models/user';
import type { CourseModel } from '@/models/course';
import { 
    UserPlus, Mail, Save, User, Fingerprint, Phone, BookOpen, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstructorNewStudentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [instructorCourses, setInstructorCourses] = useState<CourseModel[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        identificacion: '',
    });

    useEffect(() => {
        if (!user) return;
        CourseService.getByInstructor(user.uid).then(setInstructorCourses);
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setError('El nombre y apellido son requeridos');
            return;
        }
        
        if (!formData.email.trim() || !formData.password) {
            setError('El correo y contraseña son requeridos');
            return;
        }

        if (selectedCourses.length === 0) {
            setError('Selecciona al menos un curso para matricular al estudiante');
            return;
        }

        try {
            setLoading(true);
            if (!db) throw new Error('Firebase not configured');

            const secondaryAuth = getSecondaryAuth();
            if (!secondaryAuth) throw new Error('Auth no disponible');
            const cred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
            const uid = cred.user.uid;
            await signOut(secondaryAuth);

            await setDoc(doc(db, 'users', uid), {
                uid,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: 'USUARIO',
                identification: formData.identificacion,
                isActive: true,
                institutionId: user?.institutionId || 'SIERCP-GENERAL',
                status: 'ACTIVE',
                stats: {
                    totalSessions: 0, sessionsToday: 0, averageScore: 0, bestScore: 0,
                    streakDays: 0, totalHours: 0, averageDepthMm: 0, averageRatePerMin: 0,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            for (const courseId of selectedCourses) {
                const course = instructorCourses.find(c => c.id === courseId);
                if (course) {
                    await CourseService.enroll(courseId, {
                        studentId: uid,
                        studentName: `${formData.firstName} ${formData.lastName}`,
                        studentEmail: formData.email,
                        identificacion: formData.identificacion,
                        enrolledAt: new Date(),
                        completedModules: 0,
                        avgScore: 0,
                        sessionCount: 0,
                        status: 'active',
                    });
                }
            }

            toast.success('Estudiante creado y matriculado exitosamente');
            router.push('/instructor/students');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al crear estudiante';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const toggleCourse = (courseId: string) => {
        setSelectedCourses(prev => 
            prev.includes(courseId) 
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Agregar Estudiante" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero 
                        title="Nuevo Estudiante" 
                        subtitle="Registra un nuevo estudiante y matrículalo en tus cursos"
                        parentTitle="Estudiantes"
                        parentHref="/instructor/students"
                    />

                    {error && (
                        <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 32, padding: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'grid', gap: 32 }}>
                            
                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <User size={20} style={{ color: 'var(--brand)' }} /> Información Personal
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Nombres" icon={User} placeholder="Ej. Juan Andrés" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                                    <FormInput label="Apellidos" icon={User} placeholder="Ej. Pérez García" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                                    <FormInput label="Identificación" icon={Fingerprint} placeholder="1.000.000.000" value={formData.identificacion} onChange={(v: string) => setFormData({...formData, identificacion: v})} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Mail size={20} style={{ color: 'var(--brand)' }} /> Credenciales de Acceso
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                                    <FormInput label="Correo Electrónico" icon={Mail} placeholder="estudiante@siercp.edu.co" required type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                                    <FormInput label="Contraseña Temporal" icon={Mail} placeholder="••••••••" required type="password" value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <BookOpen size={20} style={{ color: 'var(--brand)' }} /> Matrícula en Cursos
                                </h3>
                                <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                                    Selecciona los cursos en los que deseas matricular al estudiante:
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {instructorCourses.map(course => (
                                        <button
                                            key={course.id}
                                            type="button"
                                            onClick={() => toggleCourse(course.id)}
                                            style={{
                                                padding: '16px 20px', borderRadius: 16,
                                                border: '1px solid var(--border)', background: selectedCourses.includes(course.id) ? 'var(--accent)' : 'var(--text-on-brand)',
                                                color: selectedCourses.includes(course.id) ? 'var(--brand)' : 'var(--text-secondary)',
                                                fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            }}
                                        >
                                            <span>{course.title}</span>
                                            {selectedCourses.includes(course.id) && (
                                                <Check size={18} style={{ color: 'var(--brand)' }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {instructorCourses.length === 0 && (
                                    <div style={{ padding: 24, textAlign: 'center', background: 'var(--muted)', borderRadius: 16, color: 'var(--text-secondary)' }}>
                                        No tienes cursos activos. Crea un curso primero.
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                <button 
                                    type="button" 
                                    onClick={() => router.back()}
                                    style={{ flex: 1, padding: '16px', borderRadius: 16, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        flex: 2, padding: '16px', borderRadius: 16, background: 'var(--brand)', color: 'var(--text-on-brand)', 
                                        border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    <Save size={20} /> {loading ? 'CREANDO...' : 'CREAR Y MATRICULAR'}
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
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
                        border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 15, 
                        color: 'var(--foreground)', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                    }} 
                />
            </div>
        </div>
    );
}