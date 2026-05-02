'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/lib/constants';
import { ROLE_SUPER_ADMIN } from '@/lib/constants';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: Role[];
    fallback?: string;
}

export function RoleGuard({ children, allowedRoles, fallback = '/home' }: RoleGuardProps) {
    const { user, initialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!initialized || !user) return;

        if (user.role === ROLE_SUPER_ADMIN) return;

        if (user.role === 'INSTRUCTOR' && user.status === 'PENDING') {
            router.replace('/pending-approval');
            return;
        }

        if (!allowedRoles.includes(user.role as Role)) {
            router.replace(fallback);
        }
    }, [initialized, user, allowedRoles, fallback, router]);

    if (!initialized || !user) return null;

    if (user.role === ROLE_SUPER_ADMIN) return <>{children}</>;

    if (user.role === 'INSTRUCTOR' && user.status === 'PENDING') return null;
    if (!allowedRoles.includes(user.role as Role)) return null;

    return <>{children}</>;
}