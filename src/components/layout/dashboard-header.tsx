'use client';

import { useAuthStore } from '@/stores/auth-store';
import { getFullName } from '@/models/user';
import { useThemeStore } from '@/stores/theme-store';
import { Search, Bell, Mail, Sun, Moon } from 'lucide-react';

function HeaderSkeleton() {
    return (
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex flex-col gap-1">
                <div className="w-24 h-3 bg-slate-200 rounded" />
                <div className="w-16 h-2 bg-slate-100 rounded" />
            </div>
        </div>
    );
}

export function DashboardHeader() {
    const user = useAuthStore((s) => s.user);
    const initialized = useAuthStore((s) => s.initialized);
    const theme = useThemeStore((s) => s.theme);
    const toggleTheme = useThemeStore((s) => s.toggleTheme);

    const isLoading = !initialized;
    const displayName = user ? getFullName(user) : null;
    const initials = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '') || '?';

    return (
        <header className="flex items-center justify-between mb-8 z-10 px-8 py-6">
            <div className="flex items-center gap-8">
                {/* Institutional logo */}
                <div className="flex items-center gap-3">
                    <img
                        src="/images/logov3.png"
                        alt="SIERCP"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                {/* User pill — dynamic or skeleton */}
                {isLoading ? (
                    <HeaderSkeleton />
                ) : user ? (
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={displayName ?? ''} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                                    {initials}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-700">{displayName}</div>
                            <div className="text-xs text-slate-400">{user.role}</div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="pl-10 pr-4 py-2 bg-transparent border-none text-sm w-64 focus:ring-0 placeholder-slate-400 text-slate-700 outline-none"
                        placeholder="Buscar sesión, estudiante..."
                        type="text"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="w-12 h-6 bg-blue-50 rounded-full relative shadow-inner flex items-center px-1 border-none cursor-pointer"
                    >
                        <div
                            className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-500 transition-transform duration-200"
                            style={theme === 'dark' ? { transform: 'translateX(24px)' } : {}}
                        >
                            {theme === 'dark' ? <Moon size={10} /> : <Sun size={10} />}
                        </div>
                    </button>

                    <button className="relative text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 flex">
                        <Bell size={20} strokeWidth={1.5} />
                    </button>

                    <button className="relative text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 flex">
                        <Mail size={20} strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        </header>
    );
}
