'use client';

import { useEffect, useState } from 'react';
import { SuperAdminService } from '@/services/super-admin.service';
import type { UserModel } from '@/models/user';

export default function PendingInstructorsPage() {
    const [instructors, setInstructors] = useState<UserModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPending();
    }, []);

    const loadPending = async () => {
        const data = await SuperAdminService.getPendingInstructors();
        setInstructors(data);
        setLoading(false);
    };

    const handleApprove = async (uid: string) => {
        try {
            await SuperAdminService.approveInstructor(uid);
            loadPending();
        } catch (err) {
            console.error('Error approving instructor:', err);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Instructores Pendientes de Aprobación</h1>
            {loading ? (
                <p>Cargando...</p>
            ) : instructors.length === 0 ? (
                <p className="text-muted-foreground">No hay instructores pendientes.</p>
            ) : (
                <div className="border rounded-lg">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-3">Nombre</th>
                                <th className="text-left p-3">Email</th>
                                <th className="text-left p-3">Institución</th>
                                <th className="text-left p-3">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {instructors.map(inst => (
                                <tr key={inst.uid} className="border-b">
                                    <td className="p-3">{inst.firstName} {inst.lastName}</td>
                                    <td className="p-3">{inst.email}</td>
                                    <td className="p-3">{inst.institutionId === inst.uid ? 'Independiente' : inst.institutionId}</td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleApprove(inst.uid)}
                                            className="h-8 px-3 bg-primary text-primary-foreground rounded text-xs"
                                        >
                                            Aprobar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
