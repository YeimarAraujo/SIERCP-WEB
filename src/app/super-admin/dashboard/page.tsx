'use client';

import { useEffect, useState } from 'react';
import { UserService } from '@/services/firestore.service';
import { InstitutionService } from '@/features/institutions/services/institution.service';
import { ROLE_INSTRUCTOR, ROLE_STUDENT } from '@/shared/lib/constants';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({ institutions: 0, instructors: 0, students: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            InstitutionService.getAll(),
            UserService.getAll(),
        ]).then(([institutions, users]) => {
            setStats({
                institutions: institutions.length,
                instructors: users.filter(u => u.role === ROLE_INSTRUCTOR).length,
                students: users.filter(u => u.role === ROLE_STUDENT).length,
            });
        }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard Global SIERCP</h1>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Instituciones</h3>
                    <p className="text-2xl font-bold">{loading ? '...' : stats.institutions}</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Instructores</h3>
                    <p className="text-2xl font-bold">{loading ? '...' : stats.instructors}</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Estudiantes</h3>
                    <p className="text-2xl font-bold">{loading ? '...' : stats.students}</p>
                </div>
            </div>
            <p className="text-muted-foreground">Estadísticas globales de la plataforma.</p>
        </div>
    );
}
