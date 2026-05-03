'use client';

import { PageHeader } from '@/components/ui/page-header';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminNewInstructorPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        specialty: '',
    });

    return (
        <div>
            <PageHeader
                title="Nuevo instructor"
                subtitle="Registra un nuevo instructor en la institución"
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
                            placeholder="Nombre del instructor"
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
                            placeholder="Apellido del instructor"
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
                            placeholder="instructor@ejemplo.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block', fontSize: '13px', fontWeight: '600',
                            color: 'var(--text-secondary)', marginBottom: '6px',
                        }}>
                            Especialidad
                        </label>
                        <input
                            className="input-field"
                            placeholder="Ej: RCP avanzado"
                            value={form.specialty}
                            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                        />
                    </div>

                    <div className="divider" />

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="btn-ghost" onClick={() => router.push('/admin/instructors')}>
                            Cancelar
                        </button>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserPlus size={16} />
                            Crear instructor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
