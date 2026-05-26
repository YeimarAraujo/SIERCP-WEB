'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, doc, setDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { maniquiPackages } from '@/data/planes';
import {
    Package, TrendingUp, AlertTriangle, Plus, Minus, RefreshCw, Edit3,
    Check, X, Upload, Download, Printer, Search,
    CircleDollarSign,
} from 'lucide-react';

import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StockEntry {
    slug: string;
    name: string;
    stock: number;
    reserved: number;
    lowStockThreshold: number;
    updatedAt?: Timestamp | null;
}

interface SalesStats {
    slug: string;
    totalOrders: number;
    totalUnits: number;
    totalRevenueCOP: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return `$${n.toLocaleString('es-CO')}`; }
function shortName(s: string) { return s.length > 22 ? s.slice(0, 20) + '…' : s; }

const defaultStockEntries: StockEntry[] = maniquiPackages
    .filter(p => p.quantity !== null)
    .map(p => ({ slug: p.slug, name: p.name, stock: 0, reserved: 0, lowStockThreshold: 2 }));

// ── StockRow ──────────────────────────────────────────────────────────────────

function StockRow({ entry, stats, onUpdate }: {
    entry: StockEntry;
    stats?: SalesStats;
    onUpdate: (slug: string, stock: number, threshold: number) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [draftStock, setDraftStock] = useState(entry.stock);
    const [draftThreshold, setDraftThreshold] = useState(entry.lowStockThreshold);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!editing) {
            setDraftStock(entry.stock);
            setDraftThreshold(entry.lowStockThreshold);
        }
    }, [entry.stock, entry.lowStockThreshold, editing]);

    const available = entry.stock - (entry.reserved ?? 0);
    const isLow = available <= entry.lowStockThreshold && entry.stock > 0;
    const isOut = entry.stock === 0;
    const pkg = maniquiPackages.find(p => p.slug === entry.slug);
    const unitPrice = pkg?.unitPriceCOP ?? 0;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(entry.slug, draftStock, draftThreshold);
            setEditing(false);
            toast.success('Stock actualizado');
        } catch { toast.error('Error al guardar'); }
        finally { setSaving(false); }
    };

    const handleCancel = () => {
        setDraftStock(entry.stock);
        setDraftThreshold(entry.lowStockThreshold);
        setEditing(false);
    };

    const statusBadge = isOut
        ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#991b1b' }}>Sin stock</span>
        : isLow
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: '#92400e', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} />Bajo</span>
            : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#065f46' }}>OK</span>;

    return (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border,#f3f4f6)', display: 'grid', gridTemplateColumns: '1fr 180px 100px 100px 100px 150px 88px', alignItems: 'center', gap: 10 }}>
            {/* Name */}
            <div>
                <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 14, color: 'var(--text-primary,#111827)' }}>{entry.name}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {statusBadge}
                    <span style={{ fontSize: 11, color: 'var(--text-secondary,#6b7280)' }}>{fmt(unitPrice)} / ud.</span>
                </div>
            </div>

            {/* Stock — keyboard + ± buttons */}
            <div style={{ textAlign: 'center' }}>
                {editing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                        <button
                            onClick={() => setDraftStock(v => Math.max(0, v - 1))}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary,#6b7280)', flexShrink: 0 }}
                        ><Minus size={11} /></button>
                        <input
                            type="number"
                            min="0"
                            value={draftStock}
                            onChange={e => setDraftStock(Math.max(0, parseInt(e.target.value) || 0))}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                            style={{ width: 68, height: 32, textAlign: 'center', fontSize: 15, fontWeight: 900, color: 'var(--text-primary,#111827)', border: '2px solid var(--brand,#2563eb)', borderRadius: 8, outline: 'none', padding: '0 4px', background: 'var(--bg-card,#fff)' }}
                            autoFocus
                        />
                        <button
                            onClick={() => setDraftStock(v => v + 1)}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary,#6b7280)', flexShrink: 0 }}
                        ><Plus size={11} /></button>
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text-primary,#111827)' }}>{entry.stock}</p>
                )}
                {editing && (
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-muted,#9ca3af)' }}>Enter ✓ · Esc ✗</p>
                )}
                {!editing && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary,#6b7280)' }}>en stock</p>}
            </div>

            {/* Reserved */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#d97706' }}>{entry.reserved ?? 0}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary,#6b7280)' }}>reservados</p>
            </div>

            {/* Available */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669' }}>{available}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary,#6b7280)' }}>disponibles</p>
            </div>

            {/* Sold */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>{stats?.totalUnits ?? 0}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary,#6b7280)' }}>vendidos</p>
            </div>

            {/* Revenue */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: 'var(--text-primary,#111827)' }}>{fmt(stats?.totalRevenueCOP ?? 0)}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary,#6b7280)' }}>ingresos</p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                {editing ? (
                    <>
                        <button onClick={handleSave} disabled={saving} title="Guardar (Enter)" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {saving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                        </button>
                        <button onClick={handleCancel} title="Cancelar (Esc)" style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', color: 'var(--text-secondary,#6b7280)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={13} />
                        </button>
                    </>
                ) : (
                    <button onClick={() => setEditing(true)} title="Editar stock" style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', color: 'var(--text-secondary,#6b7280)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit3 size={13} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ── CSV Import Modal ──────────────────────────────────────────────────────────

function CSVImportModal({ onClose, onImport }: {
    onClose: () => void;
    onImport: (rows: { slug: string; stock: number; lowStockThreshold: number }[]) => Promise<void>;
}) {
    const [csv, setCsv] = useState('');
    const [preview, setPreview] = useState<{ slug: string; stock: number; lowStockThreshold: number }[]>([]);
    const [importing, setImporting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const parse = (text: string) => {
        const lines = text.trim().split('\n').filter(Boolean);
        if (lines.length < 2) return [];
        const hdrs = lines[0].split(',').map(h => h.trim().toLowerCase());
        const si = hdrs.indexOf('slug');
        const sti = hdrs.indexOf('stock');
        const thi = hdrs.findIndex(h => h === 'umbral' || h === 'lowstockthreshold' || h === 'threshold');
        if (si < 0 || sti < 0) return [];
        return lines.slice(1).map(line => {
            const c = line.split(',');
            return {
                slug: c[si]?.trim() ?? '',
                stock: parseInt(c[sti]?.trim() ?? '0', 10) || 0,
                lowStockThreshold: thi >= 0 ? (parseInt(c[thi]?.trim() ?? '2', 10) || 2) : 2,
            };
        }).filter(r => r.slug);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { const t = ev.target?.result as string; setCsv(t); setPreview(parse(t)); };
        reader.readAsText(file);
    };

    const handleText = (t: string) => { setCsv(t); setPreview(parse(t)); };

    const handleImport = async () => {
        if (!preview.length) return;
        setImporting(true);
        try { await onImport(preview); onClose(); }
        catch { toast.error('Error al importar'); }
        finally { setImporting(false); }
    };

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, width: '100%', maxWidth: 540, maxHeight: '88vh', overflowY: 'auto', background: 'var(--bg-card,#fff)', border: '1px solid var(--border,#e5e7eb)', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Importar stock desde CSV</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-muted,#f8fafc)', borderRadius: 10, marginBottom: 14, fontSize: 12, color: 'var(--text-secondary,#6b7280)', lineHeight: 1.6 }}>
                    <strong>Formato CSV requerido (headers obligatorios: slug, stock):</strong><br />
                    <code style={{ fontFamily: 'monospace', fontSize: 11 }}>slug,stock,umbral</code><br />
                    <code style={{ fontFamily: 'monospace', fontSize: 11 }}>manikin-1,50,5</code>
                </div>

                <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--brand,#2563eb)'; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border,#e5e7eb)'; }}
                    onDrop={e => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'var(--border,#e5e7eb)';
                        const file = e.dataTransfer.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => { const t = ev.target?.result as string; setCsv(t); setPreview(parse(t)); };
                        reader.readAsText(file);
                    }}
                    style={{ border: '2px dashed var(--border,#e5e7eb)', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', marginBottom: 14, transition: 'border-color 0.2s' }}
                >
                    <Upload size={26} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary,#111827)' }}>Arrastra un CSV aquí o haz clic para seleccionar</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Solo archivos .csv</p>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: 'none' }} />
                </div>

                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 8px' }}>o pega el contenido directamente:</p>
                <textarea
                    value={csv}
                    onChange={e => handleText(e.target.value)}
                    placeholder={`slug,stock,umbral\nmanikin-1,50,5`}
                    rows={4}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border,#e5e7eb)', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />

                {preview.length > 0 && (
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
                        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#059669' }}>{preview.length} entradas detectadas:</p>
                        {preview.slice(0, 6).map((r, i) => (
                            <p key={i} style={{ margin: '2px 0', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                {r.slug} → stock: {r.stock}, umbral: {r.lowStockThreshold}
                            </p>
                        ))}
                        {preview.length > 6 && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>+ {preview.length - 6} más…</p>}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleImport} disabled={!preview.length || importing} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (!preview.length || importing) ? 0.6 : 1 }}>
                        {importing ? 'Importando…' : `Importar ${preview.length} entradas`}
                    </button>
                </div>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StockPage() {
    const [entries, setEntries] = useState<StockEntry[]>([]);
    const [salesStats, setSalesStats] = useState<SalesStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showImport, setShowImport] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const stockSnap = await getDocs(collection(db, 'stock'));
            const stockMap = new Map(stockSnap.docs.map(d => [d.id, { slug: d.id, ...d.data() } as StockEntry]));
            setEntries(defaultStockEntries.map(def => stockMap.get(def.slug) ?? def));

            const ordersSnap = await getDocs(query(collection(db, 'orders'), where('type', '==', 'manikin')));
            const statMap = new Map<string, SalesStats>();
            ordersSnap.docs.forEach(d => {
                const data = d.data();
                const slug = data.packSlug as string;
                if (!slug) return;
                const prev = statMap.get(slug) ?? { slug, totalOrders: 0, totalUnits: 0, totalRevenueCOP: 0 };
                statMap.set(slug, { slug, totalOrders: prev.totalOrders + 1, totalUnits: prev.totalUnits + (data.quantity ?? 1), totalRevenueCOP: prev.totalRevenueCOP + (data.totalCOP ?? 0) });
            });
            setSalesStats([...statMap.values()]);
        } catch { toast.error('Error cargando el stock'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleUpdate = async (slug: string, stock: number, threshold: number) => {
        const ref = doc(db, 'stock', slug);
        const existing = entries.find(e => e.slug === slug);
        await setDoc(ref, { ...existing, slug, stock, lowStockThreshold: threshold, updatedAt: new Date() }, { merge: true });
        setEntries(prev => prev.map(e => e.slug === slug ? { ...e, stock, lowStockThreshold: threshold } : e));
    };

    const handleCSVImport = async (rows: { slug: string; stock: number; lowStockThreshold: number }[]) => {
        let ok = 0;
        for (const row of rows) {
            const exists = entries.find(e => e.slug === row.slug);
            if (!exists) { toast.error(`Slug no encontrado: ${row.slug}`); continue; }
            await handleUpdate(row.slug, row.stock, row.lowStockThreshold);
            ok++;
        }
        toast.success(`${ok} entradas importadas`);
    };

    const exportCSV = () => {
        const header = 'Modelo,Slug,Stock Total,Reservados,Disponibles,Vendidos,Ingresos COP,Umbral bajo';
        const rows = entries.map(e => {
            const s = salesStats.find(x => x.slug === e.slug);
            return [
                `"${e.name}"`, e.slug, e.stock, e.reserved ?? 0,
                Math.max(0, e.stock - (e.reserved ?? 0)),
                s?.totalUnits ?? 0, s?.totalRevenueCOP ?? 0, e.lowStockThreshold,
            ].join(',');
        });
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `stock-manikins-${new Date().toISOString().slice(0, 10)}.csv` });
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success('CSV exportado correctamente');
    };

    const exportPDF = () => {
        const w = window.open('', '_blank');
        if (!w) { toast.error('Activa las ventanas emergentes'); return; }
        const rows = entries.map(e => {
            const s = salesStats.find(x => x.slug === e.slug);
            const avail = Math.max(0, e.stock - (e.reserved ?? 0));
            const isOut = e.stock === 0;
            const isLow = avail <= e.lowStockThreshold && !isOut;
            const color = isOut ? '#dc2626' : isLow ? '#d97706' : '#059669';
            const label = isOut ? 'Sin stock' : isLow ? 'Stock bajo' : 'Disponible';
            return `<tr>
                <td>${e.name}</td>
                <td style="text-align:center">${e.stock}</td>
                <td style="text-align:center">${e.reserved ?? 0}</td>
                <td style="text-align:center;font-weight:bold;color:${color}">${avail}</td>
                <td style="text-align:center">${s?.totalUnits ?? 0}</td>
                <td style="text-align:right">$${(s?.totalRevenueCOP ?? 0).toLocaleString('es-CO')}</td>
                <td style="text-align:center;color:${color};font-weight:700">${label}</td>
            </tr>`;
        }).join('');
        w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Stock — SIERCP</title>
        <style>*{box-sizing:border-box;font-family:system-ui,sans-serif}body{margin:32px;color:#111}h1{font-size:20px;margin:0 0 4px}p.sub{color:#6b7280;font-size:13px;margin:0 0 24px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#374151;border-bottom:2px solid #e5e7eb}td{padding:10px 14px;border-bottom:1px solid #f3f4f6}.footer{margin-top:24px;font-size:11px;color:#9ca3af}@media print{.no-print{display:none}}</style>
        </head><body>
        <h1>Stock de Maniquíes — SIERCP</h1>
        <p class="sub">Generado: ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })} · Total en stock: ${entries.reduce((s, e) => s + e.stock, 0)} uds.</p>
        <table><thead><tr><th>Modelo</th><th>Stock</th><th>Reservados</th><th>Disponibles</th><th>Vendidos</th><th>Ingresos</th><th>Estado</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <p class="footer">SIERCP — Sistema de Entrenamiento en RCP</p>
        <script>window.onload=()=>{window.print();}</script>
        </body></html>`);
        w.document.close();
    };

    // ── Derived ──
    const totalStock = entries.reduce((s, e) => s + e.stock, 0);
    const totalAvail = entries.reduce((s, e) => s + Math.max(0, e.stock - (e.reserved ?? 0)), 0);
    const totalSold = salesStats.reduce((s, x) => s + x.totalUnits, 0);
    const totalRevenue = salesStats.reduce((s, x) => s + x.totalRevenueCOP, 0);
    const alertCount = entries.filter(e => {
        const a = e.stock - (e.reserved ?? 0);
        return e.stock === 0 || (a <= e.lowStockThreshold && e.stock > 0);
    }).length;

    const filtered = entries.filter(e =>
        !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header />
            <PageHero
                title="Gestión de Stock"
                subtitle="Administra el inventario de maniquíes"
                parentTitle="Super Admin"
                parentHref="/super-admin/dashboard"
                actions={
                    <>
                        {[
                            { icon: <Upload size={14} />, label: 'Importar CSV', onClick: () => setShowImport(true) },
                            { icon: <Download size={14} />, label: 'Exportar CSV', onClick: exportCSV },
                            { icon: <Printer size={14} />, label: 'Exportar PDF', onClick: exportPDF },
                        ].map(btn => (
                            <button key={btn.label} onClick={btn.onClick} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary,#6b7280)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {btn.icon}{btn.label}
                            </button>
                        ))}
                    </>
                }
            />

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
                {[
                    { label: 'Total en stock', value: totalStock, icon: <Package size={18} />, color: '#2563eb' },
                    { label: 'Disponibles', value: totalAvail, icon: <Check size={18} />, color: '#059669' },
                    { label: 'Vendidos', value: totalSold, icon: <TrendingUp size={18} />, color: '#7c3aed' },
                    { label: 'Alertas', value: alertCount, icon: <AlertTriangle size={18} />, color: '#d97706' },
                    { label: 'Ingresos totales por maniquíes', value: fmt(totalRevenue), icon: <CircleDollarSign size={18} />, color: '#7c3aed' },
                ].map(({ label, value, icon, color }) => (
                    <div key={label} style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
                        <div>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{value}</p>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>{label}</p>
                        </div>
                    </div>
                ))}

            </div>



            {/* Table */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Search + tip */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '0 0 260px' }}>
                        <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar modelo…" style={{ width: '100%', height: 34, paddingLeft: 34, paddingRight: 10, borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--bg-muted)' }} />
                    </div>
                    <button
                        onClick={load}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            padding: '9px 14px',
                            borderRadius: 10,
                            border: '1.5px solid var(--border,#e5e7eb)',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--text-secondary,#6b7280)',
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <RefreshCw size={14} />
                        Actualizar
                    </button>

                </div>

                {/* Column headers */}
                <div style={{ padding: '11px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 180px 100px 100px 100px 150px 88px', gap: 10 }}>
                    {['Modelo', 'Stock total', 'Reservados', 'Disponibles', 'Vendidos', 'Ingresos', ''].map((h, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: i === 0 ? 'left' : 'center' }}>{h}</span>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary,#6b7280)', fontSize: 14 }}>Cargando stock…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <Package size={32} style={{ marginBottom: 12, opacity: 0.3, color: 'var(--text-secondary)' }} />
                        <p style={{ margin: 0, color: 'var(--text-secondary,#6b7280)', fontSize: 14 }}>Sin resultados</p>
                    </div>
                ) : (
                    filtered.map(entry => (
                        <StockRow key={entry.slug} entry={entry} stats={salesStats.find(s => s.slug === entry.slug)} onUpdate={handleUpdate} />
                    ))
                )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted,#9ca3af)', marginLeft: 'auto' }}>
                Tip: al editar escribe la cantidad directamente · Enter para guardar · Esc para cancelar
            </span>


            {showImport && <CSVImportModal onClose={() => setShowImport(false)} onImport={handleCSVImport} />}
        </div>
    );
}
