'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    Building2, Cpu, ShieldCheck, Package,
    Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    PricingPlanService,
    type PricingDoc,
    type PricingCategory,
} from '@/features/super-admin/services/plan.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

type Tab = PricingCategory;

function formatCOP(n: number) {
    if (n === 0) return '—';
    return `$${n.toLocaleString('es-CO')}`;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-surface)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'var(--bg-surface-2)', marginBottom: 8 }} />
                    <div style={{ height: 12, width: '80%', borderRadius: 6, background: 'var(--bg-surface-2)' }} />
                </div>
                <div style={{ height: 20, width: 60, borderRadius: 10, background: 'var(--bg-surface-2)', flexShrink: 0 }} />
            </div>
            <div style={{ padding: '12px 18px' }}>
                <div style={{ height: 22, width: '40%', borderRadius: 6, background: 'var(--bg-surface-2)', marginBottom: 12 }} />
                {[75, 85, 65, 80].map((w, i) => (
                    <div key={i} style={{ height: 12, borderRadius: 6, background: 'var(--bg-surface-2)', marginBottom: 6, width: `${w}%` }} />
                ))}
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-surface-2)' }} />
                ))}
            </div>
        </div>
    );
}

// ── Plan card (corporativo / sst-con / sst-sin) ───────────────────────────────

function PlanCard({ plan, onEdit, onDelete, onToggle }: {
    plan: PricingDoc;
    onEdit: (p: PricingDoc) => void;
    onDelete: (p: PricingDoc) => void;
    onToggle: (p: PricingDoc) => void;
}) {
    const annualBase = plan.monthlyCOP * 12;
    const discPct = plan.annualDiscountPercent ?? 0;
    const annualFinal = plan.annualCOP ?? Math.round(annualBase * (1 - discPct / 100));

    return (
        <div style={{
            border: `1px solid ${plan.highlight ? 'var(--brand)' : 'var(--border)'}`,
            borderRadius: 16, background: 'var(--bg-surface)', overflow: 'hidden',
            opacity: plan.active ? 1 : 0.55, transition: 'opacity 0.2s',
        }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{plan.name}</span>
                        {plan.badge && (
                            <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 20, background: plan.highlight ? 'var(--brand)' : 'var(--bg-surface-2)', color: plan.highlight ? '#fff' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{plan.badge}</span>
                        )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{plan.desc}</div>
                </div>
                <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                    background: plan.active ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                    color: plan.active ? '#10b981' : '#64748b', textTransform: 'uppercase',
                }}>{plan.active ? 'ACTIVO' : 'INACTIVO'}</span>
            </div>
            <div style={{ padding: '12px 18px' }}>
                {plan.isContact ? (
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 2 }}>A medida</div>
                ) : plan.isOneTime ? (
                    <>
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 2 }}>{formatCOP(plan.monthlyCOP)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Pago único</div>
                    </>
                ) : plan.category === 'corporativo' ? (
                    <>
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {formatCOP(discPct > 0 ? annualFinal : annualBase)}<span style={{ fontSize: 13, fontWeight: 500 }}>/año</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatCOP(plan.monthlyCOP)}/mes equiv.</span>
                            {discPct > 0 && (
                                <>
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>−{discPct}%</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatCOP(annualBase)}</span>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 2 }}>{formatCOP(plan.monthlyCOP)}<span style={{ fontSize: 13, fontWeight: 500 }}>/mes</span></div>
                    </>
                )}
                <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                    {(plan.features ?? []).slice(0, 5).map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: f.included ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                            {f.included ? <Check size={12} color="#10b981" /> : <X size={12} color="#94a3b8" />}
                            {f.text}
                        </div>
                    ))}
                    {(plan.features?.length ?? 0) > 5 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>+{(plan.features?.length ?? 0) - 5} más…</div>
                    )}
                </div>
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn icon={plan.active ? EyeOff : Eye} title={plan.active ? 'Desactivar' : 'Activar'} onClick={() => onToggle(plan)} color={plan.active ? '#f59e0b' : '#10b981'} />
                <ActionBtn icon={Pencil} title="Editar" onClick={() => onEdit(plan)} />
                <ActionBtn icon={Trash2} title="Eliminar" onClick={() => onDelete(plan)} color="#ef4444" />
            </div>
        </div>
    );
}

// ── Maniqui card ──────────────────────────────────────────────────────────────

function ManiquiCard({ pkg, onEdit, onDelete, onToggle }: {
    pkg: PricingDoc;
    onEdit: (p: PricingDoc) => void;
    onDelete: (p: PricingDoc) => void;
    onToggle: (p: PricingDoc) => void;
}) {
    return (
        <div style={{
            border: `1px solid ${pkg.highlight ? 'var(--brand)' : 'var(--border)'}`,
            borderRadius: 16, background: 'var(--bg-surface)', overflow: 'hidden',
            opacity: pkg.active ? 1 : 0.55, transition: 'opacity 0.2s',
        }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{pkg.name}</span>
                        {pkg.badge && (
                            <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 20, background: pkg.highlight ? 'var(--brand)' : 'var(--bg-surface-2)', color: pkg.highlight ? '#fff' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{pkg.badge}</span>
                        )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{pkg.desc}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, flexShrink: 0, background: pkg.active ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: pkg.active ? '#10b981' : '#64748b', textTransform: 'uppercase' }}>{pkg.active ? 'ACTIVO' : 'INACTIVO'}</span>
            </div>
            <div style={{ padding: '12px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {pkg.totalPriceCOP === null ? 'Cotización' : formatCOP(pkg.totalPriceCOP ?? 0)}
                </div>
                {(pkg.discountPercent ?? 0) > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                        −{pkg.discountPercent}% descuento · {formatCOP(pkg.unitPriceCOP ?? 0)}/u
                    </div>
                )}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>
                    {pkg.quantity === null ? '12+ unidades' : `${pkg.quantity} maniquí${(pkg.quantity ?? 0) > 1 ? 'es' : ''}`}
                </div>
                <div style={{ display: 'grid', gap: 3 }}>
                    {(pkg.includes ?? []).slice(0, 4).map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <Check size={11} color="#10b981" />{item}
                        </div>
                    ))}
                    {(pkg.includes?.length ?? 0) > 4 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{(pkg.includes?.length ?? 0) - 4} más…</div>
                    )}
                </div>
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn icon={pkg.active ? EyeOff : Eye} title={pkg.active ? 'Desactivar' : 'Activar'} onClick={() => onToggle(pkg)} color={pkg.active ? '#f59e0b' : '#10b981'} />
                <ActionBtn icon={Pencil} title="Editar" onClick={() => onEdit(pkg)} />
                <ActionBtn icon={Trash2} title="Eliminar" onClick={() => onDelete(pkg)} color="#ef4444" />
            </div>
        </div>
    );
}

// ── Edit / Create Modal ───────────────────────────────────────────────────────

function PlanModal({
    doc: initial,
    isCreating,
    onClose,
    onSave,
}: {
    doc: PricingDoc;
    isCreating: boolean;
    onClose: () => void;
    onSave: (p: PricingDoc) => Promise<void>;
}) {
    const [form, setForm] = useState<PricingDoc>({
        ...initial,
        features: [...(initial.features ?? [])],
        includes: [...(initial.includes ?? [])],
    });
    // Use stored annualCOP if available — avoids round-trip drift (annual / 12) * 12 ≠ annual
    const [annualInput, setAnnualInput] = useState(initial.annualCOP ?? initial.monthlyCOP * 12);
    const [saving, setSaving] = useState(false);
    const [newFeatureText, setNewFeatureText] = useState('');
    const [newFeatureIncluded, setNewFeatureIncluded] = useState(true);
    const [newInclude, setNewInclude] = useState('');
    const isManikin = form.category === 'manikin';
    const isCorporativo = form.category === 'corporativo';
    const isSST = form.category === 'sst-con' || form.category === 'sst-sin';

    const handleAnnualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const annual = Number(e.target.value);
        setAnnualInput(annual);
        // Store exact annual to avoid round-trip drift; derive monthly for display/billing
        setForm(p => ({ ...p, annualCOP: annual, monthlyCOP: annual > 0 ? Math.round(annual / 12) : 0 }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
        if (!form.id && !isCreating) { toast.error('Error: ID de documento no encontrado'); return; }
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            toast.error(`Error al guardar: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    const addFeature = () => {
        if (!newFeatureText.trim()) return;
        setForm(p => ({ ...p, features: [...(p.features ?? []), { text: newFeatureText.trim(), included: newFeatureIncluded }] }));
        setNewFeatureText('');
    };
    const removeFeature = (i: number) => setForm(p => ({ ...p, features: (p.features ?? []).filter((_, idx) => idx !== i) }));
    const toggleFeature = (i: number) => setForm(p => ({ ...p, features: (p.features ?? []).map((f, idx) => idx === i ? { ...f, included: !f.included } : f) }));

    const addInclude = () => {
        if (!newInclude.trim()) return;
        setForm(p => ({ ...p, includes: [...(p.includes ?? []), newInclude.trim()] }));
        setNewInclude('');
    };
    const removeInclude = (i: number) => setForm(p => ({ ...p, includes: (p.includes ?? []).filter((_, idx) => idx !== i) }));

    return (
        <Modal title={isCreating ? `Nuevo ${isManikin ? 'paquete' : 'plan'}` : `Editar: ${initial.name}`} onClose={onClose}>
            <div style={{ display: 'grid', gap: 14 }}>
                <FormRow label="Nombre">
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputSt} autoFocus />
                </FormRow>
                <FormRow label="Descripción">
                    <textarea value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} rows={2} style={{ ...inputSt, height: 'auto', padding: '8px 12px' }} />
                </FormRow>

                {/* ── Plan (non-manikin) fields ── */}
                {!isManikin && (
                    <>
                        {/* Corporativo: annual price input (monthly derived) */}
                        {isCorporativo && !form.isContact && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <FormRow label="Precio anual base (COP)">
                                    <input
                                        type="number" min={0}
                                        value={annualInput}
                                        onChange={handleAnnualChange}
                                        style={inputSt}
                                        placeholder="Ej: 4560000"
                                    />
                                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                                        ≈ {formatCOP(form.monthlyCOP)}/mes
                                    </div>
                                </FormRow>
                                <FormRow label="Descuento anual (%)">
                                    <input
                                        type="number" min={0} max={100}
                                        value={form.annualDiscountPercent ?? 0}
                                        onChange={e => setForm(p => ({ ...p, annualDiscountPercent: Number(e.target.value) }))}
                                        style={inputSt}
                                        placeholder="Ej: 15"
                                    />
                                    {(form.annualDiscountPercent ?? 0) > 0 && (
                                        <div style={{ marginTop: 4, fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                                            → {formatCOP(Math.round(annualInput * (1 - (form.annualDiscountPercent ?? 0) / 100)))}/año final
                                        </div>
                                    )}
                                </FormRow>
                            </div>
                        )}

                        {/* SST/Other: monthly or pack price */}
                        {(isSST || (isCorporativo && form.isContact)) && (
                            <FormRow label={form.isOneTime ? 'Precio del paquete (COP)' : form.isContact ? 'Precio de referencia (COP)' : 'Precio mensual (COP)'}>
                                <input
                                    type="number" min={0}
                                    value={form.monthlyCOP}
                                    onChange={e => setForm(p => ({ ...p, monthlyCOP: Number(e.target.value) }))}
                                    style={inputSt}
                                />
                            </FormRow>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <FormRow label="Badge">
                                <input value={form.badge ?? ''} onChange={e => setForm(p => ({ ...p, badge: e.target.value || null }))} placeholder="Ej: Más popular" style={inputSt} />
                            </FormRow>
                            {isCorporativo && (
                                <FormRow label="Maniquíes incluidos">
                                    <input
                                        type="number" min={0}
                                        value={form.maniquiesIncluidos ?? 0}
                                        onChange={e => setForm(p => ({ ...p, maniquiesIncluidos: Number(e.target.value) }))}
                                        style={inputSt}
                                    />
                                </FormRow>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Destacado', key: 'highlight' as const },
                                { label: 'Precio a medida (contacto)', key: 'isContact' as const },
                                { label: 'Pago único', key: 'isOneTime' as const },
                            ].map(({ label, key }) => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={!!form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} style={{ width: 14, height: 14 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Features */}
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                Características ({(form.features ?? []).length})
                            </label>
                            <div style={{ display: 'grid', gap: 6, marginBottom: 10, maxHeight: 200, overflowY: 'auto' }}>
                                {(form.features ?? []).map((feat, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                                        <button type="button" onClick={() => toggleFeature(i)} style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${feat.included ? '#10b981' : 'var(--border)'}`, background: feat.included ? '#10b981' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {feat.included && <Check size={11} color="#fff" />}
                                        </button>
                                        <span style={{ flex: 1, fontSize: 13, color: feat.included ? 'var(--text-primary)' : 'var(--text-muted)', textDecoration: feat.included ? 'none' : 'line-through' }}>{feat.text}</span>
                                        <button type="button" onClick={() => removeFeature(i)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><X size={13} /></button>
                                    </div>
                                ))}
                                {(form.features?.length ?? 0) === 0 && (
                                    <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sin características. Agrega la primera.</div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    value={newFeatureText}
                                    onChange={e => setNewFeatureText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                    placeholder="Nueva característica…"
                                    style={{ ...inputSt, flex: 1 }}
                                />
                                <button type="button" onClick={() => setNewFeatureIncluded(v => !v)} title={newFeatureIncluded ? 'Incluido' : 'No incluido'} style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${newFeatureIncluded ? '#10b981' : 'var(--border)'}`, background: newFeatureIncluded ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newFeatureIncluded ? '#10b981' : 'var(--text-muted)' }}>
                                    <Check size={15} />
                                </button>
                                <button type="button" onClick={addFeature} style={{ ...btnPrimary, padding: '0 14px', height: 38, flexShrink: 0 }}><Plus size={14} /></button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Manikin fields ── */}
                {isManikin && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <FormRow label="Precio unitario (COP)">
                                <input type="number" min={0} value={form.unitPriceCOP ?? 0} onChange={e => setForm(p => ({ ...p, unitPriceCOP: Number(e.target.value) }))} style={inputSt} />
                            </FormRow>
                            <FormRow label="Precio total paquete (COP)">
                                <input
                                    type="number" min={0}
                                    value={form.totalPriceCOP ?? 0}
                                    onChange={e => {
                                        const v = Number(e.target.value);
                                        setForm(p => ({ ...p, totalPriceCOP: v > 0 ? v : null }));
                                    }}
                                    placeholder="0 = Cotización"
                                    style={inputSt}
                                />
                                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>Deja en 0 para mostrar "Cotización"</div>
                            </FormRow>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <FormRow label="Cantidad de maniquíes">
                                <input
                                    type="number" min={1}
                                    value={form.quantity ?? 1}
                                    onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) || null }))}
                                    placeholder="null = 12+"
                                    style={inputSt}
                                />
                            </FormRow>
                            <FormRow label="Descuento (%)">
                                <input type="number" min={0} max={100} value={form.discountPercent ?? 0} onChange={e => setForm(p => ({ ...p, discountPercent: Number(e.target.value) }))} style={inputSt} />
                                {(form.discountPercent ?? 0) > 0 && (form.unitPriceCOP ?? 0) > 0 && (
                                    <div style={{ marginTop: 4, fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                                        {formatCOP(Math.round((form.unitPriceCOP ?? 0) * (1 - (form.discountPercent ?? 0) / 100)))}/u con desc.
                                    </div>
                                )}
                            </FormRow>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                            <FormRow label="Badge">
                                <input value={form.badge ?? ''} onChange={e => setForm(p => ({ ...p, badge: e.target.value || null }))} placeholder="Ej: Más popular" style={inputSt} />
                            </FormRow>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', paddingBottom: 2 }}>
                                <input type="checkbox" checked={!!form.highlight} onChange={e => setForm(p => ({ ...p, highlight: e.target.checked }))} style={{ width: 14, height: 14 }} />
                                <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Destacado</span>
                            </label>
                        </div>
                        {/* Includes */}
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                Incluye ({(form.includes ?? []).length})
                            </label>
                            <div style={{ display: 'grid', gap: 6, marginBottom: 10, maxHeight: 160, overflowY: 'auto' }}>
                                {(form.includes ?? []).map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                                        <Check size={11} color="#10b981" style={{ flexShrink: 0 }} />
                                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{item}</span>
                                        <button type="button" onClick={() => removeInclude(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><X size={13} /></button>
                                    </div>
                                ))}
                                {(form.includes?.length ?? 0) === 0 && (
                                    <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sin ítems. Agrega el primero.</div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    value={newInclude}
                                    onChange={e => setNewInclude(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInclude())}
                                    placeholder="Qué incluye este paquete…"
                                    style={{ ...inputSt, flex: 1 }}
                                />
                                <button type="button" onClick={addInclude} style={{ ...btnPrimary, padding: '0 14px', height: 38, flexShrink: 0 }}><Plus size={14} /></button>
                            </div>
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <button onClick={onClose} style={btnSecondary} disabled={saving}>Cancelar</button>
                    <button onClick={handleSave} style={btnPrimary} disabled={saving}>
                        {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                        {isCreating ? 'Crear' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}


const TABS: { id: Tab; label: string; icon: typeof Building2; desc: string }[] = [
    { id: 'corporativo', label: 'Planes Corporativos', icon: Building2, desc: 'Suscripción mensual con maniquíes incluidos' },
    { id: 'manikin', label: 'Paquetes Maniquí', icon: Cpu, desc: 'Pago único por hardware IoT' },
    { id: 'sst-con', label: 'Licencias SST', icon: ShieldCheck, desc: 'Suscripción mensual con licencia SST' },
    { id: 'sst-sin', label: 'Packs SST sin Lic.', icon: Package, desc: 'Pago único por paquete de certificados' },
];

export default function SuperAdminPlansPage() {
    const [activeTab, setActiveTab] = useState<Tab>('corporativo');
    const [allPlans, setAllPlans] = useState<PricingDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalDoc, setModalDoc] = useState<PricingDoc | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [confirmDel, setConfirmDel] = useState<PricingDoc | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        // Seed with deterministic IDs (idempotent), then purge legacy random-ID duplicates
        PricingPlanService.seed().catch(() => { });
        PricingPlanService.purgeDuplicates().catch(() => { });

        const unsub = PricingPlanService.subscribe(
            docs => { setAllPlans(docs); setLoading(false); setError(null); },
            err => { setError(err.message); setLoading(false); },
        );
        return () => unsub();
    }, []);

    const tabPlans = allPlans.filter(p => p.category === activeTab);

    function openCreate() {
        const base: PricingDoc = {
            id: '',
            category: activeTab,
            active: true,
            deletedAt: null,
            displayOrder: tabPlans.length,
            slug: `nuevo-${Date.now()}`,
            name: '',
            desc: '',
            monthlyCOP: 0,
            highlight: false,
            badge: null,
            features: [],
            includes: [],
            quantity: activeTab === 'manikin' ? 1 : undefined,
            unitPriceCOP: 0,
            totalPriceCOP: null,
            discountPercent: 0,
            annualDiscountPercent: activeTab === 'corporativo' ? 0 : undefined,
        };
        setModalDoc(base);
        setIsCreating(true);
    }

    async function handleSave(updated: PricingDoc) {
        // Strip Firestore-managed fields before writing
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...rawData } = updated;
        // Strip undefined values so Firestore doesn't ignore them unexpectedly
        const data = Object.fromEntries(
            Object.entries(rawData).filter(([, v]) => v !== undefined)
        ) as Omit<PricingDoc, 'id' | 'createdAt' | 'updatedAt'>;

        if (isCreating) {
            const docId = `${updated.category}-${updated.slug}`;
            await PricingPlanService.createWithId(docId, data);
            toast.success(activeTab === 'manikin' ? 'Paquete creado' : 'Plan creado');
        } else {
            if (!id) throw new Error('ID de documento no encontrado. Recarga la página.');
            await PricingPlanService.update(id, data);
            toast.success(activeTab === 'manikin' ? 'Paquete actualizado' : 'Plan actualizado');
        }
    }

    async function handleToggle(plan: PricingDoc) {
        try {
            await PricingPlanService.toggle(plan.id, !plan.active);
            toast.success(!plan.active ? 'Plan activado' : 'Plan desactivado');
        } catch {
            toast.error('Error al cambiar estado');
        }
    }

    async function handleDelete() {
        if (!confirmDel) return;
        setDeleting(true);
        try {
            await PricingPlanService.softDelete(confirmDel.id);
            toast.success('Eliminado correctamente');
            setConfirmDel(null);
        } catch {
            toast.error('Error al eliminar');
        } finally {
            setDeleting(false);
        }
    }

    function closeModal() { setModalDoc(null); setIsCreating(false); }

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header title="Planes y Licencias" />
            <PageHero
                title="Gestión de planes"
                subtitle="Configura precios, características y disponibilidad de todos los productos"
                parentTitle="Super Admin"
                parentHref="/super-admin/dashboard"
            />

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
                {TABS.map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '10px 18px', borderRadius: '10px 10px 0 0',
                                border: active ? '1px solid var(--border)' : '1px solid transparent',
                                borderBottom: active ? '1px solid var(--bg-surface)' : '1px solid transparent',
                                background: active ? 'var(--bg-surface)' : 'transparent',
                                color: active ? 'var(--brand)' : 'var(--text-muted)',
                                fontWeight: active ? 800 : 600, fontSize: 13,
                                cursor: 'pointer', marginBottom: active ? -1 : 0,
                                transition: 'all 0.15s',
                            }}
                        >
                            <Icon size={15} strokeWidth={active ? 2.5 : 2} />{t.label}
                        </button>
                    );
                })}
            </div>

            {/* Description + add button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{TABS.find(t => t.id === activeTab)?.desc}</p>
                <button onClick={openCreate} style={btnPrimary}>
                    <Plus size={14} /> Nuevo
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 13 }}>
                    Error de conexión con Firestore: {error}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && tabPlans.length === 0 && (
                <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                    No hay {activeTab === 'manikin' ? 'paquetes' : 'planes'} en esta categoría.{' '}
                    <button onClick={openCreate} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 700, fontSize: 14, padding: 0 }}>
                        Crear el primero →
                    </button>
                </div>
            )}

            {/* Cards */}
            {!loading && !error && tabPlans.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {tabPlans.map(plan =>
                        plan.category === 'manikin' ? (
                            <ManiquiCard
                                key={plan.id}
                                pkg={plan}
                                onEdit={p => { setModalDoc(p); setIsCreating(false); }}
                                onDelete={p => setConfirmDel(p)}
                                onToggle={handleToggle}
                            />
                        ) : (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onEdit={p => { setModalDoc(p); setIsCreating(false); }}
                                onDelete={p => setConfirmDel(p)}
                                onToggle={handleToggle}
                            />
                        )
                    )}
                </div>
            )}

            {/* Edit / Create Modal */}
            {modalDoc && (
                <PlanModal
                    doc={modalDoc}
                    isCreating={isCreating}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}

            {/* Confirm delete */}
            {confirmDel && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }}
                        onClick={() => !deleting && setConfirmDel(null)}
                    />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>¿Eliminar "{confirmDel.name}"?</h3>
                        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                            Se aplicará soft delete y dejará de mostrarse en el sitio público. No se borra de la base de datos.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmDel(null)} style={btnSecondary} disabled={deleting}>Cancelar</button>
                            <button onClick={handleDelete} style={{ ...btnPrimary, background: '#ef4444' }} disabled={deleting}>
                                {deleting && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Shared micro-components ────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={onClose} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 24 }}>{children}</div>
            </div>
        </>
    );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}

function ActionBtn({ icon: Icon, title, onClick, color = 'var(--text-muted)' }: { icon: typeof Pencil; title: string; onClick: () => void; color?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
        >
            <Icon size={13} />
        </button>
    );
}

const inputSt: React.CSSProperties = { height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, width: '100%', outline: 'none' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' };
