'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/lib/constants';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: Role[];
    fallback?: string;
}

export function RoleGuard({ children, allowedRoles, fallback = '/home' }: RoleGuardProps) {
    const { user, initialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (initialized && user && !allowedRoles.includes(user.role as Role)) {
            router.replace(fallback);
        }
    }, [initialized, user, allowedRoles, fallback, router]);

    if (!initialized || !user) return null;
    if (!allowedRoles.includes(user.role as Role)) return null;

    return <>{children}</>;
}