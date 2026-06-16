'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { UserPlus, Search, Mail, ChevronRight, UserCheck, Phone, QrCode, Copy, Check, Download, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { QRCodeSVG } from 'qrcode.react';
import type { UserModel } from '@/models/user';

function InviteQrModal({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const qrValue = `siercp://join?institution=${institutionId}&role=instructor`;

    const handleCopy = () => {
        navigator.clipboard.writeText(qrValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const handleDownload = () => {
        const svg = document.getElementById('invite-qr-svg');
        if (!svg) return;
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 460;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 460);
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 20, 20, 360, 360);
            ctx.fillStyle = '#1a1a1a';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Invitación de Instructor', 200, 420);
            ctx.fillStyle = '#666';
            ctx.font = '11px monospace';
            ctx.fillText(institutionId, 200, 445);
            const link = document.createElement('a');
            link.download = `invite-instructor-${institutionId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(svg))}`;
    };

    return (
        <>
            <div
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                background: 'var(--card)', borderRadius: 28, padding: 40, zIndex: 1001,
                boxShadow: '0 24px 60px rgba(0,0,0,0.25)', width: 360, maxWidth: '90vw',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--foreground)' }}>Invitar Instructor</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Comparte este QR para vincular instructores</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid var(--border)' }}>
                    <QRCodeSVG id="invite-qr-svg" value={qrValue} size={200} level="M" />
                </div>

                <div style={{ width: '100%', padding: '10px 16px', background: 'var(--muted)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Enlace de invitación</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{qrValue}</div>
                </div>

                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                    <button onClick={handleCopy} style={qrBtnStyle}>
                        {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                        {copied ? 'Copiado' : 'Copiar enlace'}
                    </button>
                    <button onClick={handleDownload} style={qrBtnStyle}>
                        <Download size={14} />
                        Descargar QR
                    </button>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    El instructor escanea el QR con la app SIERCP<br />y queda vinculado automáticamente a tu institución.
                </div>
            </div>
        </>
    );
}

const qrBtnStyle: React.CSSProperties = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 12px', borderRadius: 10, background: 'var(--muted)',
    border: '1px solid var(--border)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', color: 'var(--text-secondary)',
};

export default function AdminInstructorsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showQr, setShowQr] = useState(false);

    const institutionId: string | null = user?.institutionId ?? null;

    useEffect(() => {
        if (authLoading) return;
        if (!user?.institutionId) {
            setLoading(false);
            return;
        }

        const institutionId = user.institutionId;
        const fetchInstructors = async () => {
            try {
                // 1. Memberships con rol INSTRUCTOR en esta institución
                const memSnap = await getDocs(query(
                    collection(db, 'memberships'),
                    where('institutionId', '==', institutionId),
                    where('role', '==', 'INSTRUCTOR'),
                    where('isActive', '==', true),
                ));
                console.log('institutionId:', institutionId);
                console.log('memSnap size:', memSnap.size);
                console.log('docs:', memSnap.docs.map(d => d.data()));

                if (memSnap.empty) {
                    setInstructors([]);
                    return;
                }

                // Scope por sede: admin de sede solo ve instructores de su sede.
                const scopeSedeId = user?.sedeId;
                const scopedMemDocs = scopeSedeId
                    ? memSnap.docs.filter(m => m.data().sedeId === scopeSedeId)
                    : memSnap.docs;

                // 2. Fetch user docs en paralelo
                const userDocs = await Promise.all(
                    scopedMemDocs.map(m => getDoc(doc(db, 'users', m.data().userId)))
                );
                const baseUsers = userDocs
                    .filter(s => s.exists())
                    .map(s => ({ ...s.data() as any, uid: s.id }));

                // 3. Contar cursos reales por instructor (instructorId + instructorIds[])
                const withCounts = await Promise.all(
                    baseUsers.map(async (instructor) => {
                        try {
                            // Cursos donde es instructor primario
                            const [snap1, snap2] = await Promise.all([
                                getDocs(query(
                                    collection(db, 'courses'),
                                    where('institutionId', '==', institutionId),
                                    where('instructorId', '==', instructor.uid),
                                )),
                                getDocs(query(
                                    collection(db, 'courses'),
                                    where('institutionId', '==', institutionId),
                                    where('instructorIds', 'array-contains', instructor.uid),
                                )),
                            ]);

                            // Deduplicar por id
                            const courseMap = new Map<string, any>();
                            [...snap1.docs, ...snap2.docs].forEach(d => courseMap.set(d.id, d.data()));

                            const coursesCount = courseMap.size;
                            const studentsCount = [...courseMap.values()]
                                .reduce((sum, c) => sum + (c.studentCount ?? 0), 0);

                            return { ...instructor, coursesCount, studentsCount };
                        } catch {
                            return { ...instructor, coursesCount: 0, studentsCount: 0 };
                        }
                    })
                );

                setInstructors(withCounts);
            } catch (err) {
                console.error('Error fetching instructors:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();


    }, [institutionId, authLoading, user?.sedeId]);

    const filteredInstructors = instructors.filter(i =>
        (i.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            key: 'firstName',
            label: 'Instructor',
            render: (_: any, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 700 }}>
                        {row.firstName?.charAt(0) || 'I'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 14 }}>{row.firstName} {row.lastName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.identification}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            label: 'Contacto',
            render: (val: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                    <Mail size={14} /> {val}
                </div>
            )
        },
        {
            key: 'phoneNumber',
            label: 'Número',
            render: (val: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                    <Phone size={14} /> {val}
                </div>
            )
        },
        {
            key: 'coursesCount',
            label: 'Carga Académica',
            render: (_: any, row: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{row.coursesCount} Cursos</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.studentsCount} Alumnos totales</div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Estado',
            render: (val: string) => (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#DCFCE7', color: '#166534', fontSize: 11, fontWeight: 800 }}>
                    <UserCheck size={12} /> ACTIVO
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, row: any) => (
                <button
                    onClick={() => router.push(`/admin/instructors/${row.uid}`)}
                    style={{ background: 'none', border: 'none', color: 'var(--border-strong)', cursor: 'pointer', padding: 8 }}
                >
                    <ChevronRight size={20} />
                </button>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            {showQr && institutionId && (
                <InviteQrModal institutionId={institutionId} onClose={() => setShowQr(false)} />
            )}
            <Header title="Gestión de Facultad" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Directorio de Instructores"
                    subtitle="Administración de credenciales, asignación de cursos y seguimiento docente"
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <div style={{ display: 'flex', gap: 10 }}>
                            {institutionId && (
                                <button
                                    onClick={() => setShowQr(true)}
                                    style={{
                                        padding: '12px 20px', borderRadius: 14,
                                        background: 'var(--muted)', color: 'var(--foreground)',
                                        border: '1px solid var(--border)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}
                                >
                                    <QrCode size={17} /> Invitar por QR
                                </button>
                            )}
                            <button
                                onClick={() => router.push('/admin/instructors/new')}
                                style={{
                                    padding: '12px 24px', borderRadius: 14, background: 'var(--brand)', color: 'var(--text-on-brand)',
                                    border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                                }}
                            >
                                <UserPlus size={18} /> Registrar Instructor
                            </button>
                        </div>
                    }
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid var(--border)',
                                    fontSize: 14, outline: 'none', background: 'var(--muted)'
                                }}
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredInstructors}
                        loading={loading}
                        emptyMessage="No se han encontrado instructores registrados en la base de datos institucional."
                    />
                </div>
            </div>
        </div>
    );
}
