'use client';

import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminNewStudentPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        identification: '',
        courseId: '',
    });

    return (
        <div>
            <PageHeader
                title="Nuevo estudiante"
                subtitle="Registra un nuevo estudiante en la institución"
            />

            <div className="card-padded" style={{ maxWidth: 600 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{
                            display: 'block', fontSize: '13px', fontWeight: '600',
                            color: 'var(--text-secondary)', marginBottom: '6px',
                        }}>
                            Nombre
                        </label>
                        <input
                            className="input-field"
                            placeholder="Nombre del estudiante"
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block', fontSize: '13px', fontWeight: '600',
                            color: 'var(--text-secondary)', marginBottom: '6px',
                        }}>
                            Apellido
                        </label>
                        <input
                            className="input-field"
                            placeholder="Apellido del estudiante"
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block', fontSize: '13px', fontWeight: '600',
                            color: 'var(--text-secondary)', marginBottom: '6px',
                        }}>
                            Correo electrónico
                        </label>
                        <input
                            className="input-field"
                            type="email"
                            placeholder="estudiante@ejemplo.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block', fontSize: '13px', fontWeight: '600',
                            color: 'var(--text-secondary)', marginBottom: '6px',
                        }}>
                            Número de identificación
                        </label>
                        <input
                            className="input-field"
                            placeholder="Cédula o documento"
                            value={form.identification}
                            onChange={(e) => setForm({ ...form, identification: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block', fontSize: '13px', fontWeight: '600',
                            color: 'var(--text-secondary)', marginBottom: '6px',
                        }}>
                            Curso (opcional)
                        </label>
                        <select className="input-field" value={form.courseId}
                            onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                            <option value="">Seleccionar curso</option>
                        </select>
                    </div>

                    <div className="divider" />

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="btn-ghost" onClick={() => router.push('/admin/students')}>
                            Cancelar
                        </button>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserPlus size={16} />
                            Crear estudiante
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
