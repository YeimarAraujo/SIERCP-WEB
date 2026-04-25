'use client';

import { useAuth } from '@/hooks/use-auth';
import { getUserInitials, getFullName } from '@/models/user';

interface HeaderProps {
    title?: string;
}

export function Header({ title }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
            <h1 className="text-sm font-semibold text-foreground">{title ?? 'Dashboard'}</h1>
            {user && (
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs font-medium">{getFullName(user)}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {getUserInitials(user)}
                    </div>
                </div>
            )}
        </header>
    );
}