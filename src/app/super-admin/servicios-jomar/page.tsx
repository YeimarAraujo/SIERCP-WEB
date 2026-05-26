'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    collection, doc, updateDoc, deleteDoc, addDoc, onSnapshot,
    query, orderBy, serverTimestamp, writeBatch, setDoc,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    Briefcase, Plus, Search, Pencil, Trash2, Eye, EyeOff, X, Download,
} from 'lucide-react';
import { servicios as serviciosEstaticos } from '@/data/servicios';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PasoProcesso {
    paso: number;
    titulo: string;
    descripcion: string;
}

interface Industria {
    nombre: string;
    icono: string;
}

interface JomarServicio {
    id: string;
    slug: string;
    nombre: string;
    descripcion: string;
    descripcionLarga: string;
    entregables: string[];
    paraQuien: string;
    normativa: string[];
    precioDesdeCOP: number;
    tags: string[];
    icono: string;
    esServicioCorporativo: boolean;
    proceso: PasoProcesso[];
    industrias: Industria[];
    isPublished: boolean;
    createdAt?: { toDate?: () => Date };
}

const EMPTY_SERVICIO: Omit<JomarServicio, 'id' | 'createdAt'> = {
    slug: '', nombre: '', descripcion: '', descripcionLarga: '',
    entregables: [], paraQuien: '', normativa: [], precioDesdeCOP: 0,
    tags: [], icono: 'bi-briefcase', esServicioCorporativo: true,
    proceso: [
        { paso: 1, titulo: 'Diagnóstico inicial', descripcion: '' },
        { paso: 2, titulo: 'Propuesta personalizada', descripcion: '' },
        { paso: 3, titulo: 'Ejecución', descripcion: '' },
        { paso: 4, titulo: 'Certificación y cierre', descripcion: '' },
    ],
    industrias: [],
    isPublished: false,
};

// ── Styles ────────────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
    height: 36, padding: '0 10px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, width: '100%', outline: 'none',
};
const labelSt: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
};
const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)',
    color: '#fff', border: 'none', cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--bg-surface-2)',
    color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer',
};
const btnIcon: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg-surface-2)', cursor: 'pointer', color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
};

// ── ChipsInput ────────────────────────────────────────────────────────────────

function ChipsInput({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
    const [input, setInput] = useState('');
    const add = () => {
        const v = input.trim();
        if (!v || values.includes(v)) return;
        onChange([...values, v]);
        setInput('');
    };
    return (
        <div>
            <label style={labelSt}>{label}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 6 }}>
                {values.map((v, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-primary)' }}>
                        {v}
                        <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, lineHeight: 1 }}><X size={11} /></button>
                    </span>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} placeholder={`Agregar ${label.toLowerCase()}…`} style={{ ...inputSt, flex: 1 }} />
                <button type="button" onClick={add} style={{ ...btnPrimary, padding: '0 12px', height: 36 }}><Plus size={13} /></button>
            </div>
        </div>
    );
}

// ── Industrias editor ─────────────────────────────────────────────────────────

function IndustriasEditor({ industrias, onChange }: { industrias: Industria[]; onChange: (v: Industria[]) => void }) {
    const update = (i: number, patch: Partial<Industria>) =>
        onChange(industrias.map((ind, idx) => idx === i ? { ...ind, ...patch } : ind));
    return (
        <div style={{ display: 'grid', gap: 8 }}>
            {industrias.map((ind, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                    <div>
                        {i === 0 && <label style={labelSt}>Nombre</label>}
                        <input value={ind.nombre} onChange={e => update(i, { nombre: e.target.value })} placeholder="Hospitales" style={{ ...inputSt, marginTop: i === 0 ? 4 : 0 }} />
                    </div>
                    <div>
                        {i === 0 && <label style={labelSt}>Icono Bootstrap</label>}
                        <input value={ind.icono} onChange={e => update(i, { icono: e.target.value })} placeholder="bi-hospital" style={{ ...inputSt, marginTop: i === 0 ? 4 : 0 }} />
                    </div>
                    <button type="button" onClick={() => onChange(industrias.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><X size={14} /></button>
                </div>
            ))}
            <button type="button" onClick={() => onChange([...industrias, { nombre: '', icono: 'bi-building' }])} style={{ ...btnSecondary, justifyContent: 'center', padding: '6px 0' }}>
                <Plus size={13} /> Agregar industria
            </button>
        </div>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ServicioModal({ servicio, onClose, onSaved }: { servicio: JomarServicio | null; onClose: () => void; onSaved: () => void }) {
    const isEdit = !!servicio;
    const [form, setForm] = useState<Omit<JomarServicio, 'id' | 'createdAt'>>(
        servicio
            ? {
                slug: servicio.slug, nombre: servicio.nombre, descripcion: servicio.descripcion,
                descripcionLarga: servicio.descripcionLarga, entregables: servicio.entregables ?? [],
                paraQuien: servicio.paraQuien, normativa: servicio.normativa ?? [],
                precioDesdeCOP: servicio.precioDesdeCOP, tags: servicio.tags ?? [],
                icono: servicio.icono, esServicioCorporativo: servicio.esServicioCorporativo,
                proceso: servicio.proceso ?? [], industrias: servicio.industrias ?? [],
                isPublished: servicio.isPublished,
            }
            : { ...EMPTY_SERVICIO },
    );
    const [saving, setSaving] = useState(false);
    const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

    const updatePaso = (i: number, patch: Partial<PasoProcesso>) =>
        setForm(p => ({ ...p, proceso: p.proceso.map((paso, idx) => idx === i ? { ...paso, ...patch } : paso) }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
        setSaving(true);
        try {
            const payload = { ...form, updatedAt: serverTimestamp() };
            if (isEdit) {
                await updateDoc(doc(db, 'jomarServices', servicio!.id), payload);
                toast.success('Servicio actualizado');
            } else {
                const slug = form.slug.trim() || form.nombre.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                const id = `jomar-${slug}`;
                await setDoc(doc(db, 'jomarServices', id), { ...payload, slug: slug || id, createdAt: serverTimestamp() });
                toast.success('Servicio creado');
            }
            onSaved();
            onClose();
        } catch { toast.error('Error al guardar'); }
        finally { setSaving(false); }
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={onClose} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 1000, width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto',
                background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 20,
                boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
            }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-surface-2)', zIndex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{isEdit ? `Editar: ${servicio!.nombre}` : 'Nuevo servicio Jomar'}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>

                <form onSubmit={handleSave} style={{ padding: 20, display: 'grid', gap: 14 }}>

                    {/* Básico */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelSt}>Nombre *</label>
                            <input value={form.nombre} onChange={s('nombre')} required placeholder="Ej: Brigada de Emergencia" style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                        <div>
                            <label style={labelSt}>Slug (URL)</label>
                            <input value={form.slug} onChange={s('slug')} placeholder="brigada-de-emergencia" style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                        <div>
                            <label style={labelSt}>Icono Bootstrap</label>
                            <input value={form.icono} onChange={s('icono')} placeholder="bi-shield-check" style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                        <div>
                            <label style={labelSt}>Precio desde (COP)</label>
                            <input type="number" min={0} value={form.precioDesdeCOP} onChange={s('precioDesdeCOP')} style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 18 }}>
                            <button type="button" onClick={() => setForm(p => ({ ...p, isPublished: !p.isPublished }))}
                                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.isPublished ? '#10b981' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                <span style={{ position: 'absolute', top: 3, left: form.isPublished ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                            </button>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{form.isPublished ? 'Publicado' : 'Oculto'}</span>
                        </div>
                    </div>

                    {/* Descripciones */}
                    <div style={{ display: 'grid', gap: 10 }}>
                        <div>
                            <label style={labelSt}>Descripción corta</label>
                            <textarea value={form.descripcion} onChange={s('descripcion')} rows={2} placeholder="Una línea descriptiva…" style={{ ...inputSt, marginTop: 4, height: 'auto', padding: '8px 10px', resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={labelSt}>Descripción larga</label>
                            <textarea value={form.descripcionLarga} onChange={s('descripcionLarga')} rows={4} placeholder="Descripción completa para la página del servicio…" style={{ ...inputSt, marginTop: 4, height: 'auto', padding: '8px 10px', resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={labelSt}>Para quién es</label>
                            <textarea value={form.paraQuien} onChange={s('paraQuien')} rows={2} placeholder="Ej: Empresas que necesiten cumplir normativa SST…" style={{ ...inputSt, marginTop: 4, height: 'auto', padding: '8px 10px', resize: 'vertical' }} />
                        </div>
                    </div>

                    {/* Arrays */}
                    <ChipsInput label="Entregables" values={form.entregables} onChange={v => setForm(p => ({ ...p, entregables: v }))} />
                    <ChipsInput label="Normativa" values={form.normativa} onChange={v => setForm(p => ({ ...p, normativa: v }))} />
                    <ChipsInput label="Tags" values={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} />

                    {/* Proceso */}
                    <div>
                        <label style={{ ...labelSt, display: 'block', marginBottom: 8 }}>Pasos del proceso</label>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {form.proceso.map((paso, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: 8, alignItems: 'start' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, marginTop: 4 }}>{paso.paso}</div>
                                    <input value={paso.titulo} onChange={e => updatePaso(i, { titulo: e.target.value })} placeholder="Título del paso" style={inputSt} />
                                    <input value={paso.descripcion} onChange={e => updatePaso(i, { descripcion: e.target.value })} placeholder="Descripción breve" style={inputSt} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Industrias */}
                    <div>
                        <label style={{ ...labelSt, display: 'block', marginBottom: 8 }}>Industrias objetivo</label>
                        <IndustriasEditor industrias={form.industrias} onChange={v => setForm(p => ({ ...p, industrias: v }))} />
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
                        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear servicio'}</button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuperAdminServiciosJomarPage() {
    const [servicios, setServicios] = useState<JomarServicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<JomarServicio | 'create' | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<JomarServicio | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'jomarServices'), orderBy('createdAt', 'desc')),
            snap => {
                setServicios(snap.docs.map(d => ({ id: d.id, ...EMPTY_SERVICIO, ...d.data() } as JomarServicio)));
                setLoading(false);
            },
            () => { toast.error('Error al cargar servicios'); setLoading(false); },
        );
        return () => unsub();
    }, []);

    const seedFromStatic = useCallback(async () => {
        setSeeding(true);
        try {
            const batch = writeBatch(db);
            for (const s of serviciosEstaticos) {
                const id = `jomar-${s.slug}`;
                const ref = doc(db, 'jomarServices', id);
                batch.set(ref, {
                    ...s,
                    isPublished: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
            await batch.commit();
            toast.success(`${serviciosEstaticos.length} servicios importados correctamente`);
        } catch { toast.error('Error al importar servicios'); }
        finally { setSeeding(false); }
    }, []);

    const togglePublish = async (s: JomarServicio) => {
        try {
            await updateDoc(doc(db, 'jomarServices', s.id), { isPublished: !s.isPublished, updatedAt: serverTimestamp() });
            toast.success(`Servicio ${!s.isPublished ? 'publicado' : 'ocultado'}`);
        } catch { toast.error('Error'); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteDoc(doc(db, 'jomarServices', confirmDelete.id));
            toast.success('Servicio eliminado');
        } catch { toast.error('Error al eliminar'); }
        setConfirmDelete(null);
    };

    const filtered = servicios.filter(s =>
        !search || s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (s.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    const stats = {
        total: servicios.length,
        published: servicios.filter(s => s.isPublished).length,
    };

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header title="Servicios Jomar" />
            <PageHero title="Servicios de Jomar Segurid" subtitle="Servicios corporativos SST gestionados por Jomar" parentTitle="Super Admin" parentHref="/super-admin/dashboard" />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Total servicios', value: stats.total, color: '#6366f1', icon: Briefcase },
                    { label: 'Publicados', value: stats.published, color: '#10b981', icon: Eye },
                ].map(st => (
                    <div key={st.label} style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${st.color}18`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <st.icon size={16} color={st.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: st.color, lineHeight: 1 }}>{st.value}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 3 }}>{st.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o tag…" style={{ ...inputSt, paddingLeft: 36, width: '100%' }} />
                </div>
                {servicios.length === 0 && !loading && (
                    <button onClick={seedFromStatic} disabled={seeding} style={{ ...btnSecondary, whiteSpace: 'nowrap' }}>
                        <Download size={14} />{seeding ? 'Importando…' : 'Importar servicios base'}
                    </button>
                )}
                <button onClick={() => setModal('create')} style={btnPrimary}><Plus size={15} /> Nuevo servicio</button>
            </div>

            {/* Cards */}
            {loading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando…</div>
            ) : filtered.length === 0 && servicios.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 20, display: 'grid', gap: 16 }}>
                    <div style={{ fontSize: 40 }}>💼</div>
                    <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>No hay servicios en Firestore</p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Importa los {serviciosEstaticos.length} servicios base o crea uno desde cero.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={seedFromStatic} disabled={seeding} style={{ ...btnPrimary, background: '#059669' }}>
                            <Download size={15} />{seeding ? 'Importando…' : `Importar ${serviciosEstaticos.length} servicios base`}
                        </button>
                        <button onClick={() => setModal('create')} style={btnSecondary}><Plus size={15} /> Crear manualmente</button>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 16 }}>
                    Sin resultados para &ldquo;{search}&rdquo;
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {filtered.map(s => (
                        <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-surface)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-alpha, rgba(37,99,235,0.1))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                            <i className={`bi ${s.icono}`} style={{ color: 'var(--brand)', fontSize: 16 }} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nombre}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.descripcion || 'Sin descripción'}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: s.isPublished ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: s.isPublished ? '#10b981' : '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {s.isPublished ? 'PUBLICADO' : 'OCULTO'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '10px 16px', flex: 1 }}>
                                {s.precioDesdeCOP > 0 && (
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                                        Desde <span style={{ color: 'var(--brand)' }}>${s.precioDesdeCOP.toLocaleString('es-CO')} COP</span>
                                    </div>
                                )}
                                {(s.tags ?? []).length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                                        {s.tags.slice(0, 4).map((t, i) => (
                                            <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{t}</span>
                                        ))}
                                    </div>
                                )}
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {s.entregables?.length ?? 0} entregable{(s.entregables?.length ?? 0) !== 1 ? 's' : ''} ·{' '}
                                    {s.industrias?.length ?? 0} industria{(s.industrias?.length ?? 0) !== 1 ? 's' : ''}
                                </div>
                            </div>

                            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button onClick={() => togglePublish(s)} style={{ ...btnIcon, color: s.isPublished ? '#f59e0b' : '#10b981' }} title={s.isPublished ? 'Ocultar' : 'Publicar'}>
                                    {s.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <button onClick={() => setModal(s)} style={btnIcon} title="Editar"><Pencil size={13} /></button>
                                <button onClick={() => setConfirmDelete(s)} style={{ ...btnIcon, color: '#ef4444' }} title="Eliminar"><Trash2 size={13} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {(modal === 'create' || (modal && typeof modal !== 'string')) && (
                <ServicioModal servicio={modal === 'create' ? null : modal as JomarServicio} onClose={() => setModal(null)} onSaved={() => setModal(null)} />
            )}

            {confirmDelete && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={() => setConfirmDelete(null)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 800 }}>¿Eliminar servicio?</h3>
                        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                            Se eliminará <strong>{confirmDelete.nombre}</strong> permanentemente de Firestore.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmDelete(null)} style={btnSecondary}>Cancelar</button>
                            <button onClick={handleDelete} style={{ ...btnPrimary, background: '#ef4444' }}>Eliminar</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
