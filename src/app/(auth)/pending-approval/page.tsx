'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function PendingApprovalPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !(user.role === 'INSTRUCTOR' && user.status === 'PENDING')) {
            router.replace('/home');
        }
    }, [user, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 text-2xl">
                    ⏳
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Cuenta pendiente de aprobación</h1>
                <p className="text-sm text-muted-foreground">
                    Tu cuenta de instructor ha sido registrada con el correo:
                    <br />
                    <strong>{user.email}</strong>
                </p>
                {user.institutionId && user.institutionId !== user.uid && (
                    <p className="text-sm text-muted-foreground">
                        Institución vinculada: <strong>{user.institutionId}</strong>
                    </p>
                )}
                {user.institutionId === user.uid && (
                    <p className="text-sm text-muted-foreground">
                        Registro como instructor independiente
                    </p>
                )}
                <div className="bg-muted p-4 rounded-lg text-sm text-left">
                    <p>Un administrador del equipo SIERCP revisará tu solicitud.</p>
                    <p className="mt-2">Te notificaremos por correo electrónico cuando tu cuenta sea aprobada.</p>
                </div>
                <button
                    onClick={() => logout()}
                    className="w-full h-10 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
                >
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}
