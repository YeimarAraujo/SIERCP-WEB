'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { corporatePlans } from '@/data/planes';
import { PricingPlanService, type PricingDoc } from '@/features/super-admin/services/plan.service';
import { ChevronRight, ShieldCheck, Lock } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, functions, auth } from '@/shared/lib/firebase';
import toast from 'react-hot-toast';
import { fmt, validateEmail, validatePhone, validateNIT, IVA_RATE } from '../_lib';
import {
    Field, Input, SearchableSelect,
    AccountAccessSection, validateAccount, type AccountData, type AccountErrors, emptyAccountData,
    PasswordInput, PasswordStrengthBar, TermsRow,
    CheckoutLayout, CheckoutSuspenseFallback, PaymentForm, PaymentSummaryBox,
    OrderSummaryShell, SummaryProductCard, SummaryFeatureList, SummaryPriceBlock, SummaryBadge,
    SelectableOption, RadioDot, OptionBadge,
    btnPrimary, btnSecondary,
    type PayMethod, type CardData, type PseData,
} from '../_components/ui';
import { KeyRound } from 'lucide-react';
import { COLOMBIA_DEPARTMENTS, getMunicipalities } from '@/data/colombia-geo';

const ANNUAL_MONTHS = 12;

function annualTotal(plan: PricingDoc) {
    const fullSubtotal = plan.monthlyCOP * ANNUAL_MONTHS;
    const discountPct = plan.annualDiscountPercent ?? 0;
    // annualCOP is the exact pre-IVA annual price stored by SA — avoids round-trip drift
    const subtotal = plan.annualCOP ?? (fullSubtotal - Math.round(fullSubtotal * (discountPct / 100)));
    const discountAmount = fullSubtotal - subtotal;
    const iva = Math.round(subtotal * IVA_RATE);
    return { fullSubtotal, discountPct, discountAmount, subtotal, iva, total: subtotal + iva };
}

// ── Order summary ─────────────────────────────────────────────────────────────

function OrderSummary({ plan, footerContent }: { plan: PricingDoc; footerContent?: React.ReactNode }) {
    const { fullSubtotal, discountPct, discountAmount, subtotal, iva, total } = annualTotal(plan);
    return (
        <OrderSummaryShell
            title="Resumen del pedido"
            badge={<SummaryBadge color="amber" icon={<ShieldCheck size={13} />}>Contrato anual · 12 meses · sin renovación automática</SummaryBadge>}
            footerContent={footerContent}
        >
            <SummaryProductCard
                name={plan.name}
                desc={plan.desc}
                badge={plan.maniquiesIncluidos ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-primary,#2563eb)' }}>
                        {plan.maniquiesIncluidos} maniquí{plan.maniquiesIncluidos > 1 ? 'es' : ''} incluido{plan.maniquiesIncluidos > 1 ? 's' : ''}
                    </span>
                ) : undefined}
            />
            <SummaryFeatureList features={(plan.features ?? []).filter(f => f.included).slice(0, 6).map(f => f.text)} />
            <SummaryPriceBlock
                extras={
                    <div style={{ display: 'grid', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
                            <span>{fmt(plan.monthlyCOP)}/mes × {ANNUAL_MONTHS} meses</span>
                            <span style={{ textDecoration: discountPct > 0 ? 'line-through' : 'none' }}>{fmt(fullSubtotal)}</span>
                        </div>
                        {discountPct > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>Descuento anual −{discountPct}%</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>−{fmt(discountAmount)}</span>
                            </div>
                        )}
                    </div>
                }
                subtotalLabel="Subtotal anual"
                subtotal={subtotal}
                ivaAmount={iva}
                totalLabel="Total anual"
                total={total}
            />
        </OrderSummaryShell>
    );
}

// ── Step 1: Plan selection ────────────────────────────────────────────────────

function Step1({ plans, selected, onSelect }: { plans: PricingDoc[]; selected: string; onSelect: (s: string) => void }) {
    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--clr-text,#111827)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Selecciona tu plan</h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 24px' }}>
                Contrato anual · incluye maniquíes SIERCP y acceso completo a la plataforma.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
                {plans.map(plan => {
                    const active = selected === plan.slug;
                    const yearly = plan.monthlyCOP * ANNUAL_MONTHS;
                    return (
                        <SelectableOption key={plan.slug} active={active} onClick={() => onSelect(plan.slug)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <RadioDot active={active} />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--clr-text,#111827)' }}>{plan.name}</span>
                                        {plan.badge && <OptionBadge>{plan.badge}</OptionBadge>}
                                    </div>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--clr-text-muted,#6b7280)' }}>{plan.desc}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                {plan.isContact ? (
                                    <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--clr-text,#111827)' }}>A medida</div>
                                ) : (() => {
                                    const disc = plan.annualDiscountPercent ?? 0;
                                    // annualCOP is the exact annual price from Firebase — avoids drift
                                    const discountedYearly = plan.annualCOP ?? Math.round(yearly * (1 - disc / 100));
                                    return (
                                        <>
                                            <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--clr-text,#111827)' }}>
                                                {fmt(plan.monthlyCOP)}<span style={{ fontWeight: 400, fontSize: 11 }}>/mes</span>
                                            </div>
                                            {disc > 0 ? (
                                                <>
                                                    <div style={{ fontSize: 10, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(yearly)}/año</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                                        <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>−{disc}%</span>
                                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>{fmt(discountedYearly)}/año</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>{fmt(discountedYearly)}/año</div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </SelectableOption>
                    );
                })}
            </div>
        </div>
    );
}

// ── Step 2: Company data ──────────────────────────────────────────────────────

const TIPOS_INSTITUCION = [
    'Hospital', 'Clínica', 'Centro médico', 'IPS (Prestadora de Salud)', 'EPS',
    'Universidad', 'Institución educativa', 'Colegio / Escuela',
    'Corporación', 'Empresa privada', 'Entidad pública',
    'Bomberos', 'Defensa Civil', 'Cruz Roja',
    'Gimnasio / Centro fitness', 'ONG', 'Otro',
];

interface CompanyForm {
    institucionName: string; nit: string; tipoInstitucion: string;
    responsable: string; apellidoResponsable: string; cargo: string;
    email: string; telefono: string; departamento: string; ciudad: string; direccion: string;
}
type CompanyErrors = Partial<Record<keyof CompanyForm, string>>;
const emptyForm: CompanyForm = { institucionName: '', nit: '', tipoInstitucion: '', responsable: '', apellidoResponsable: '', cargo: '', email: '', telefono: '', departamento: '', ciudad: '', direccion: '' };

function validateCompanyForm(form: CompanyForm): CompanyErrors {
    const errs: CompanyErrors = {};
    if (!form.institucionName.trim()) errs.institucionName = 'Campo requerido';
    const nitErr = validateNIT(form.nit); if (nitErr) errs.nit = nitErr;
    if (!form.tipoInstitucion) errs.tipoInstitucion = 'Selecciona un tipo';
    if (!form.responsable.trim()) errs.responsable = 'Campo requerido';
    if (!form.apellidoResponsable.trim()) errs.apellidoResponsable = 'Campo requerido';
    if (!form.cargo.trim()) errs.cargo = 'Campo requerido';
    const emailErr = validateEmail(form.email); if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(form.telefono); if (phoneErr) errs.telefono = phoneErr;
    if (!form.departamento) errs.departamento = 'Campo requerido';
    if (!form.ciudad.trim()) errs.ciudad = 'Campo requerido';
    if (!form.direccion.trim()) errs.direccion = 'Campo requerido';
    return errs;
}

function Step2({ form, setForm, errors, accountData, setAccountData, accountErrors, accountSubmitRef }: {
    form: CompanyForm; setForm: (f: CompanyForm) => void;
    errors: CompanyErrors;
    accountData: AccountData; setAccountData: (d: AccountData) => void;
    accountErrors: AccountErrors;
    accountSubmitRef: React.RefObject<(() => Promise<boolean>) | null>;
}) {
    const s = (k: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
    const sSelect = (k: keyof CompanyForm) => (e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
    const municipios = getMunicipalities(form.departamento);
    const isExisting = accountData.mode === 'existing';
    const setAcc = (k: keyof typeof accountData) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setAccountData({ ...accountData, [k]: e.target.value });

    // Both modes show the full company form; credentials section changes below
    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--clr-text,#111827)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {isExisting ? 'Vincular empresa a cuenta existente' : 'Datos de la empresa'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 24px' }}>
                {isExisting
                    ? 'Completa los datos de la empresa y vincula tu cuenta existente.'
                    : 'Todos los campos son requeridos para facturación, contrato y creación de tu cuenta.'}
            </p>
            <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                    <Field label="Nombre de la institución" required error={errors.institucionName}>
                        <Input value={form.institucionName} onChange={s('institucionName')} placeholder="Hospital Central S.A.S." />
                    </Field>
                    <Field label="NIT" required error={errors.nit}>
                        <Input value={form.nit} onChange={s('nit')} placeholder="900000000" />
                    </Field>
                </div>
                <Field label="Tipo de institución" required error={errors.tipoInstitucion}>
                    <select
                        value={form.tipoInstitucion}
                        onChange={sSelect('tipoInstitucion')}
                        style={{
                            width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
                            border: `1px solid ${errors.tipoInstitucion ? '#ef4444' : 'var(--clr-border,#e5e7eb)'}`,
                            background: 'var(--clr-bg-surface,#fff)', color: form.tipoInstitucion ? 'var(--clr-text,#111827)' : 'var(--clr-text-muted,#9ca3af)',
                            outline: 'none', cursor: 'pointer',
                        }}
                    >
                        <option value="" disabled>Selecciona el tipo de institución…</option>
                        {TIPOS_INSTITUCION.map(t => (
                            <option key={t} value={t} style={{ color: 'var(--clr-text,#111827)' }}>{t}</option>
                        ))}
                    </select>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <Field label="Nombre del responsable" required error={errors.responsable}>
                        <Input value={form.responsable} onChange={s('responsable')} placeholder="Nombre" />
                    </Field>
                    <Field label="Apellido del responsable" required error={errors.apellidoResponsable}>
                        <Input value={form.apellidoResponsable} onChange={s('apellidoResponsable')} placeholder="Apellido" />
                    </Field>
                    <Field label="Cargo" required error={errors.cargo}>
                        <Input value={form.cargo} onChange={s('cargo')} placeholder="Gerente / Director SST" />
                    </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Correo corporativo" required error={errors.email}>
                        <Input type="email" value={form.email} onChange={s('email')} placeholder="contacto@empresa.co" />
                    </Field>
                    <Field label="Teléfono" required error={errors.telefono}>
                        <Input value={form.telefono} onChange={s('telefono')} placeholder="3001234567" />
                    </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <Field label="Departamento" required error={errors.departamento}>
                        <SearchableSelect
                            value={form.departamento}
                            onChange={v => setForm({ ...form, departamento: v, ciudad: '' })}
                            options={COLOMBIA_DEPARTMENTS}
                            placeholder="Buscar departamento…"
                        />
                    </Field>
                    <Field label="Ciudad / Municipio" required error={errors.ciudad}>
                        <SearchableSelect
                            value={form.ciudad}
                            onChange={v => setForm({ ...form, ciudad: v })}
                            options={municipios}
                            placeholder={form.departamento ? 'Buscar municipio…' : 'Selecciona un departamento'}
                            disabled={!form.departamento}
                        />
                    </Field>
                    <Field label="Dirección" required error={errors.direccion}>
                        <Input value={form.direccion} onChange={s('direccion')} placeholder="Cra. 1 # 2-3" />
                    </Field>
                </div>

                {/* Credential section */}
                <div style={{ marginTop: 4, paddingTop: 20, borderTop: '1px solid var(--clr-border,#e5e7eb)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <KeyRound size={14} style={{ color: 'var(--clr-primary,#2563eb)', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--clr-text-muted,#6b7280)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Credenciales de acceso
                        </span>
                    </div>
                    {isExisting ? (
                        // AccountAccessSection handles TermsRow internally when verified
                        <AccountAccessSection
                            email={form.email}
                            data={accountData}
                            setData={setAccountData}
                            errors={accountErrors}
                            submitRef={accountSubmitRef}
                        />
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <PasswordInput
                                        label="Contraseña"
                                        required
                                        value={accountData.contrasena}
                                        onChange={setAcc('contrasena')}
                                        placeholder="Mín. 8 chars, letras, números y símbolo"
                                        error={accountErrors.contrasena}
                                    />
                                    <PasswordStrengthBar value={accountData.contrasena} />
                                </div>
                                <PasswordInput
                                    label="Confirmar contraseña"
                                    required
                                    value={accountData.confirmarContrasena}
                                    onChange={setAcc('confirmarContrasena')}
                                    error={accountErrors.confirmarContrasena}
                                />
                            </div>
                            <div style={{ marginTop: 14 }}>
                                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--clr-text-muted,#6b7280)', textAlign: 'center' }}>
                                    ¿Ya tienes cuenta?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setAccountData({ ...accountData, mode: 'existing' })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary,#2563eb)', fontWeight: 700, fontSize: 12, padding: 0 }}
                                    >
                                        Inicia sesión aquí
                                    </button>
                                </p>
                                <TermsRow
                                    checked={accountData.aceptaTerminos}
                                    onToggle={() => setAccountData({ ...accountData, aceptaTerminos: !accountData.aceptaTerminos })}
                                    error={accountErrors.aceptaTerminos}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Step 3: Payment ───────────────────────────────────────────────────────────

function Step3({ plan, companyForm, processing, paySubmitRef, onBack, onPay }: {
    plan: PricingDoc; companyForm: CompanyForm;
    processing: boolean;
    paySubmitRef: { current: (() => void) | null };
    onBack: () => void;
    onPay: (method: PayMethod, card: CardData, pse: PseData) => void;
}) {
    const { total } = annualTotal(plan);
    return (
        <PaymentForm
            payLabel={`Contratar plan — ${fmt(total)} COP/año`}
            processing={processing}
            onBack={onBack}
            onPay={onPay}
            submitRef={paySubmitRef}
            summaryContent={
                <PaymentSummaryBox
                    rows={[
                        { label: 'Plan', value: plan.name },
                        { label: 'Institución', value: companyForm.institucionName },
                        { label: 'Contrato', value: '12 meses · anual' },
                    ]}
                    totalLabel="Total anual a pagar"
                    total={fmt(total)}
                />
            }
        />
    );
}

// ── Firestore duplicate checks ────────────────────────────────────────────────

async function checkDuplicateNIT(nit: string): Promise<boolean> {
    const clean = nit.replace(/[.\s-]/g, '');
    const snap = await getDocs(query(collection(db, 'institutions'), where('nit', '==', clean)));
    return !snap.empty;
}

async function checkDuplicateEmail(email: string): Promise<boolean> {
    const snap = await getDocs(query(collection(db, 'institutions'), where('adminEmail', '==', email.toLowerCase())));
    return !snap.empty;
}

// ── Client-side provisioning (fallback when CF unavailable) ──────────────────

async function provisionClientSide(uid: string, company: CompanyForm, planSlug: string): Promise<string> {
    const planExpiresDate = new Date();
    planExpiresDate.setFullYear(planExpiresDate.getFullYear() + 1);
    const planExpiresAt = Timestamp.fromDate(planExpiresDate);
    const nit = company.nit.replace(/[.\s-]/g, '');
    const firstName = company.responsable.trim();
    const lastName = company.apellidoResponsable.trim();

    // Step 1: Create institution
    const institutionRef = doc(collection(db, 'institutions'));
    const institutionId = institutionRef.id;
    await setDoc(institutionRef, {
        name: company.institucionName,
        nit,
        type: company.tipoInstitucion,
        status: 'active',
        contactEmail: company.email.toLowerCase(),
        adminEmail: company.email.toLowerCase(),
        phoneNumber: company.telefono || null,
        address: company.direccion || null,
        city: company.ciudad || null,
        department: company.departamento || null,
        country: 'Colombia',
        primaryAdminId: uid,
        memberCount: 1,
        activeCoursesCount: 0,
        totalSessionsCount: 0,
        planType: planSlug,
        planActivatedAt: serverTimestamp(),
        planExpiresAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        config: {},
    });

    // Step 2: Create user doc with ADMIN role
    await setDoc(doc(db, 'users', uid), {
        uid,
        email: company.email.toLowerCase(),
        firstName,
        lastName,
        identificacion: nit,
        institutionId,
        role: 'ADMIN',
        isActive: true,
        certVerification: 'NONE',
        coursesCreated: 0,
        memberships: [institutionId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: { totalSessions: 0, sessionsToday: 0, averageScore: 0, bestScore: 0, streakDays: 0, totalHours: 0, averageDepthMm: 0, averageRatePerMin: 0 },
    });

    // Step 3: Create admin membership
    await setDoc(doc(db, 'memberships', `${uid}_${institutionId}`), {
        userId: uid,
        institutionId,
        role: 'ADMIN',
        status: 'approved',
        isActive: true,
        planType: planSlug,
        planExpiresAt,
        creditBalance: 0,
        sstLicenseVerified: false,
        usageCurrentUsers: 0,
        usageCurrentCourses: 0,
        usageCertificatesThisMonth: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Step 4: Create order record
    const planMeta = corporatePlans.find(p => p.slug === planSlug);
    const monthly = planMeta?.monthlyCOP ?? 0;
    const disc = planMeta?.annualDiscountPercent ?? 0;
    const subtotal = Math.round(monthly * 12 * (1 - disc / 100));
    const iva = Math.round(subtotal * IVA_RATE);
    await setDoc(doc(collection(db, 'orders')), {
        userId: uid,
        institutionId,
        planSlug,
        product: `Plan ${planMeta?.name ?? planSlug}`,
        subtotal,
        iva,
        total: subtotal + iva,
        payMethod: 'client-side',
        status: 'paid',
        createdAt: serverTimestamp(),
    });

    return institutionId;
}

// ── CF types ──────────────────────────────────────────────────────────────────

interface CreateOrderPayload {
    planSlug: string;
    company: CompanyForm;
    payMethod: string;
    cardLast4: string | null;
    bank: string | null;
}
interface CreateOrderResult {
    orderId: string;
    monthlyBaseCOP: number;
    annualFullCOP: number;
    annualDiscountPercent: number;
    discountAmount: number;
    annualSubtotalCOP: number;
    ivaCOP: number;
    totalCOP: number;
}

interface ProvisionPayload {
    orderId: string;
    planSlug: string;
    company: CompanyForm;
}
interface ProvisionResult {
    institutionId: string;
    uid: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

// Fallback plans from static data shaped as PricingDoc (used until Firebase loads)
const staticFallback: PricingDoc[] = corporatePlans.map((p, i) => ({
    id: `corporativo-${p.slug}`,
    category: 'corporativo' as const,
    active: true,
    deletedAt: null,
    displayOrder: i,
    highlight: (p as unknown as { highlight?: boolean }).highlight ?? false,
    ...(p as unknown as Omit<PricingDoc, 'id' | 'category' | 'active' | 'deletedAt' | 'displayOrder' | 'highlight'>),
}));

function Content() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const updateLocalUser = useAuthStore(s => s.updateLocalUser);
    const planFromQuery = searchParams.get('plan');
    const [step, setStep] = useState(planFromQuery ? 1 : 0);
    const [selectedPlan, setSelectedPlan] = useState(
        corporatePlans.find(p => p.slug === planFromQuery)?.slug ?? corporatePlans[0]?.slug ?? 'pyme'
    );
    const [firePlans, setFirePlans] = useState<PricingDoc[]>(staticFallback);
    const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyForm);
    const [companyErrors, setCompanyErrors] = useState<CompanyErrors>({});
    const [accountData, setAccountData] = useState<AccountData>(emptyAccountData);
    const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
    const [checking, setChecking] = useState(false);
    const [processing, setProcessing] = useState(false);
    const paySubmitRef = useRef<(() => void) | null>(null);
    const accountSubmitRef = useRef<(() => Promise<boolean>) | null>(null);

    useEffect(() => {
        const unsub = PricingPlanService.subscribe(
            docs => {
                const corp = docs.filter(d => d.category === 'corporativo' && d.active && !d.isContact);
                if (corp.length > 0) setFirePlans(corp);
            },
            err => console.error('pricing_plans error', err),
        );
        return unsub;
    }, []);

    const plans = firePlans;
    const currentPlan = plans.find(p => p.slug === selectedPlan) ?? plans[0];
    const { total: totalAnual } = annualTotal(currentPlan);

    const handleStep2Next = async () => {
        // Validate company form for both modes
        const formErrs = validateCompanyForm(companyForm);
        setCompanyErrors(formErrs);

        if (accountData.mode === 'existing') {
            if (Object.keys(formErrs).length > 0) return;
            if (!accountData.existingVerified) {
                setChecking(true);
                const ok = await accountSubmitRef.current?.();
                setChecking(false);
                if (!ok) return;
            }
            const accErrs = validateAccount('', { ...accountData, existingVerified: true });
            setAccountErrors(accErrs);
            if (Object.keys(accErrs).length > 0) return;
            setChecking(true);
            try {
                if (await checkDuplicateNIT(companyForm.nit)) { toast.error('Ya existe una institución registrada con ese NIT.'); return; }
                setStep(2);
            } catch {
                setStep(2);
            } finally {
                setChecking(false);
            }
            return;
        }

        const accErrs = validateAccount(companyForm.email, accountData);
        setAccountErrors(accErrs);
        if (Object.keys(formErrs).length > 0 || Object.keys(accErrs).length > 0) return;
        setChecking(true);
        try {
            if (await checkDuplicateNIT(companyForm.nit)) { toast.error('Ya existe una institución registrada con ese NIT.'); return; }
            if (await checkDuplicateEmail(companyForm.email)) { toast.error('Ya existe una institución registrada con ese correo electrónico.'); return; }
            setStep(2);
        } catch {
            setStep(2);
        } finally {
            setChecking(false);
        }
    };

    const handlePay = async (method: PayMethod, card: CardData, pse: PseData) => {
        setProcessing(true);
        let orderId: string | undefined;
        try {
            // ── FASE 1: Registrar intento de pago (server-side pricing) ──────
            // Se crea el pedido ANTES de crear la cuenta.
            // Si esta fase falla, no se crea ninguna cuenta.
            try {
                const createOrder = httpsCallable<CreateOrderPayload, CreateOrderResult>(
                    functions, 'createCorporatePlanOrderWeb'
                );
                const orderResult = await createOrder({
                    planSlug: currentPlan.slug,
                    company: companyForm,
                    payMethod: method,
                    cardLast4: method === 'card' ? card.numero.replace(/\s/g, '').slice(-4) : null,
                    bank: method === 'pse' ? pse.banco : null,
                });
                orderId = orderResult.data.orderId;
            } catch {
                // CF no disponible — continuar en modo demo (sin registro de orden)
            }

            // ── FASE 2: Procesamiento del pago ───────────────────────────────
            // TODO: Integrar pasarela real (Wompi, PayU, etc.).
            // En producción se llamaría al gateway y se esperaría la respuesta:
            //   const result = await processPayment(orderId, method, card, pse);
            //   if (result.status !== 'APPROVED') throw new Error('Pago rechazado por la entidad');
            //
            // Por ahora el pago es simulado — siempre aprobado.
            // La cuenta se crea solo después de esta línea (pago aprobado).

            // ── FASE 3: Pago aprobado → crear cuenta ─────────────────────────
            if (accountData.mode === 'new') {
                await createUserWithEmailAndPassword(auth, companyForm.email, accountData.contrasena);
            }

            const uid = auth.currentUser?.uid;
            if (!uid) throw new Error('No se pudo autenticar el usuario.');

            // ── FASE 4: Provisionar organización ─────────────────────────────
            // Intenta CF primero; si no está desplegado, provisiona client-side.
            let provisionedInstitutionId: string | undefined;
            try {
                const provision = httpsCallable<ProvisionPayload, ProvisionResult>(
                    functions, 'provisionCorporateAccount'
                );
                const res = await provision({
                    orderId: orderId ?? '',
                    planSlug: currentPlan.slug,
                    company: companyForm,
                });
                provisionedInstitutionId = res.data.institutionId;
            } catch {
                provisionedInstitutionId = await provisionClientSide(uid, companyForm, currentPlan.slug);
            }

            // Actualizar store local inmediatamente para que el dashboard no muestre "sin institución"
            if (provisionedInstitutionId) {
                updateLocalUser({ institutionId: provisionedInstitutionId, role: 'ADMIN' });
            }

            router.push(`/checkout/resultado?type=plan&plan=${currentPlan.slug}&status=approved${orderId ? `&order=${orderId}` : ''}`);
        } catch (err) {
            setProcessing(false);
            const code = (err as { code?: string }).code ?? '';
            if (code === 'auth/email-already-in-use') {
                toast.error('Este correo ya está registrado. Usa "Ya tienes cuenta" para vincular tu empresa.');
            } else if (code === 'auth/weak-password') {
                toast.error('Contraseña muy débil. Usa mínimo 8 caracteres con letras, números y símbolos.');
            } else {
                const msg = err instanceof Error ? err.message : 'Error al procesar. Intenta de nuevo.';
                toast.error(msg);
            }
        }
    };

    const spinner = <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;

    const summaryFooter =
        step === 0 ? (
            <button onClick={() => setStep(1)} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
                Continuar <ChevronRight size={15} />
            </button>
        ) : step === 1 ? (
            <div style={{ display: 'grid', gap: 8 }}>
                <button onClick={handleStep2Next} disabled={checking} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: checking ? 0.7 : 1 }}>
                    {checking ? <>{spinner} Verificando…</> : <><span>Verificar y continuar</span><ChevronRight size={15} /></>}
                </button>
                <button onClick={() => setStep(0)} disabled={checking} style={{ ...btnSecondary, width: '100%', justifyContent: 'center' }}>Atrás</button>
            </div>
        ) : step === 2 ? (
            <button
                onClick={() => paySubmitRef.current?.()}
                disabled={processing}
                style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: processing ? 0.75 : 1, transition: 'background 0.2s, opacity 0.2s' }}
            >
                {processing ? <>{spinner} Procesando…</> : <><Lock size={14} /> Completar pago</>}
            </button>
        ) : null;

    const steps: Record<number, React.ReactNode> = {
        0: <Step1 plans={plans} selected={selectedPlan} onSelect={setSelectedPlan} />,
        1: <Step2 form={companyForm} setForm={setCompanyForm} errors={companyErrors} accountData={accountData} setAccountData={setAccountData} accountErrors={accountErrors} accountSubmitRef={accountSubmitRef} />,
        2: <Step3 plan={currentPlan} companyForm={companyForm} processing={processing} paySubmitRef={paySubmitRef} onBack={() => setStep(1)} onPay={handlePay} />,
    };

    return (
        <CheckoutLayout
            eyebrow="Contratación de plan"
            title="Planes corporativos SIERCP"
            maxWidth={1200}
            currentStep={step}
            stepLabels={['Plan', 'Empresa', 'Pago']}
            formContent={steps[step]}
            summary={<OrderSummary plan={currentPlan} footerContent={summaryFooter} />}
        />
    );
}

export default function PlanCheckoutPage() {
    return (
        <Suspense fallback={<CheckoutSuspenseFallback />}>
            <Content />
        </Suspense>
    );
}
