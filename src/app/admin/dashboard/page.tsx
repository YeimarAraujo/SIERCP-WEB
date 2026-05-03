'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useInstitutionData } from '@/hooks/use-institution-data';
import { Users, GraduationCap, Activity, BarChart3, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const { students, instructors, totalSessions, activeSessions, loading } = useInstitutionData();

    const firstName = user?.firstName ?? 'Administrador';
    const today = new Date().toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="w-full max-w-[1200px] mx-auto space-y-6">
            {/* ───────── WELCOME BANNER ───────── */}
            <div
                className="rounded-[20px] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                style={{ background: 'linear-gradient(135deg, #2b1055 0%, #7597de 100%)' }}
            >
                <div>
                    <p className="text-sm text-white/70 mb-1 capitalize">{today}</p>
                    <h1 className="text-[28px] font-bold text-white leading-tight">
                        Bienvenido, {firstName}
                    </h1>
                    <p className="text-sm text-white/80 mt-2">
                        {loading
                            ? 'Cargando datos de tu institución...'
                            : `Tu institución tiene ${students.length} estudiantes y ${instructors.length} instructores.`
                        }
                    </p>
                </div>
                <div className="flex items-start gap-0 sm:gap-6">
                    <div className="text-right shrink-0">
                        <p className="text-sm text-white/70 mb-1">Sesiones hoy</p>
                        <p className="text-[48px] sm:text-[64px] font-bold text-white leading-none">
                            {loading ? '...' : activeSessions}
                        </p>
                    </div>
                    <div className="w-px h-12 bg-white/20 hidden sm:block" />
                    <div className="text-right shrink-0">
                        <p className="text-sm text-white/70 mb-1">Usuarios totales</p>
                        <p className="text-2xl font-bold text-white leading-none">
                            {loading ? '...' : students.length + instructors.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* ───────── KPI ROW ───────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Estudiantes', value: students.length, route: '/admin/students', Icon: Users, iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Instructores', value: instructors.length, route: '/admin/instructors', Icon: GraduationCap, iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Sesiones activas', value: activeSessions, route: '/admin/sessions', Icon: Activity, iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400' },
                    { label: 'Total sesiones', value: totalSessions, route: '/admin/sessions', Icon: BarChart3, iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
                ].map(({ label, value, route, Icon, iconBg, iconColor }) => (
                    <div
                        key={label}
                        onClick={() => router.push(route)}
                        className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm p-6 flex justify-between items-center cursor-pointer hover:shadow-md transition-all"
                    >
                        <div>
                            <p className="text-sm text-gray-400 dark:text-slate-400 mb-1">{label}</p>
                            <p className="text-[32px] font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                {loading ? '...' : value}
                            </p>
                            <p className={`text-xs mt-1 ${value === 0 ? 'text-gray-400' : 'text-green-500'}`}>
                                {value === 0 ? 'Sin actividad' : '↑ activos'}
                            </p>
                        </div>
                        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0 hover:scale-110 transition-transform`}>
                            <Icon size={22} className={iconColor} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ───────── TWO COLUMNS ───────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ESTUDIANTES RECIENTES */}
                <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm p-6 border-t-2 border-t-blue-500">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                            Estudiantes recientes
                        </h3>
                        <button
                            onClick={() => router.push('/admin/students')}
                            className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
                        >
                            Ver todos <ChevronRight size={14} />
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-400 dark:text-slate-400 py-4">Cargando...</p>
                    ) : students.length === 0 ? (
                        <div className="py-6 text-center">
                            <Users size={32} className="text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">No hay estudiantes registrados</p>
                            <button
                                onClick={() => router.push('/admin/students/new')}
                                className="text-blue-600 border border-blue-600 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                Agregar estudiante
                            </button>
                        </div>
                    ) : (
                        students.slice(0, 5).map((s, i) => (
                            <div
                                key={s.uid}
                                onClick={() => router.push(`/admin/students/${s.uid}`)}
                                className={`flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg px-1 -mx-1 transition-all duration-150 ${
                                    i < Math.min(students.length, 5) - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-300 shrink-0">
                                    {(s.firstName?.[0] ?? '') + (s.lastName?.[0] ?? '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                                        {`${s.firstName} ${s.lastName}`.trim()}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 truncate">{s.email}</p>
                                </div>
                                <span className="text-xs font-semibold text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 px-2 py-0.5 rounded-full shrink-0">
                                    Activo
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* INSTRUCTORES */}
                <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm p-6 border-t-2 border-t-green-500">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                            Instructores
                        </h3>
                        <button
                            onClick={() => router.push('/admin/instructors')}
                            className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
                        >
                            Ver todos <ChevronRight size={14} />
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-400 dark:text-slate-400 py-4">Cargando...</p>
                    ) : instructors.length === 0 ? (
                        <div className="py-6 text-center">
                            <GraduationCap size={32} className="text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">No hay instructores registrados</p>
                            <button
                                onClick={() => router.push('/admin/instructors/new')}
                                className="text-blue-600 border border-blue-600 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                Agregar instructor
                            </button>
                        </div>
                    ) : (
                        instructors.slice(0, 5).map((inst, i) => (
                            <div
                                key={inst.uid}
                                className={`flex items-center gap-3 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg px-1 -mx-1 transition-all duration-150 ${
                                    i < Math.min(instructors.length, 5) - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-300 shrink-0">
                                    {(inst.firstName?.[0] ?? '') + (inst.lastName?.[0] ?? '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                                        {`${inst.firstName} ${inst.lastName}`.trim()}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 truncate">{inst.email}</p>
                                </div>
                                <span className="text-xs font-semibold text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 px-2 py-0.5 rounded-full shrink-0">
                                    Activo
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ───────── ÚLTIMAS EVALUACIONES ───────── */}
            <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm p-6">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                        Últimas Evaluaciones
                    </h3>
                </div>

                <div className="py-8 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                        <Activity size={28} className="text-gray-300 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-400 dark:text-slate-500">
                        No hay evaluaciones registradas
                    </p>
                    <p className="text-xs text-gray-300 dark:text-slate-600 text-center max-w-xs">
                        Las evaluaciones aparecerán aquí cuando los estudiantes completen sesiones de entrenamiento.
                    </p>
                </div>
            </div>
        </div>
    );
}