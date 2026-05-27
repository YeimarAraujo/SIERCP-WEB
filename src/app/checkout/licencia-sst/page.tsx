'use client';

import { Suspense, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { sstConLicenciaPlans } from '@/data/planes';
import { ChevronRight, ShieldCheck, Lock } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import toast from 'react-hot-toast';
import { fmt, validateEmail, validatePhone, validateCedula, IVA_RATE } from '../_lib';
import {
    Field, Input, SearchableSelect,
    AccountAccessSection, validateAccount, type AccountData, type AccountErrors, emptyAccountData,
    CheckoutLayout, CheckoutSuspenseFallback, PaymentForm, PaymentSummaryBox,
    OrderSummaryShell, SummaryProductCard, SummaryFeatureList, SummaryPriceBlock, SummaryBadge,
    SelectableOption, RadioDot, OptionBadge,
    btnPrimary, btnSecondary,
    type PayMethod, type CardData, type PseData,
} from '../_components/ui';
import { COLOMBIA_DEPARTMENTS, getMunicipalities } from '@/data/colombia-geo';

// ── Order summary ─────────────────────────────────────────────────────────────

function OrderSummary({ planSlug, footerContent }: { planSlug: string; footerContent?: React.ReactNode }) {
    const plan = sstConLicenciaPlans.find(p => p.slug === planSlug) ?? sstConLicenciaPlans[0];
    const iva = Math.round(plan.monthlyCOP * IVA_RATE);
    return (
        <OrderSummaryShell
            title="Resumen"
            badge={<SummaryBadge color="green" icon={<ShieldCheck size={13} />}>Sin permanencia mínima · cancela cuando quieras</SummaryBadge>}
            footerContent={footerContent}
        >
            <SummaryProductCard
                name={plan.name}
                desc={plan.desc}
                badge={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-primary,#2563eb)' }}>Licencia SST · suscripción mensual</span>}
            />
            <SummaryFeatureList features={plan.features.filter(f => f.included).slice(0, 6).map(f => f.text)} />
            <SummaryPriceBlock
                subtotalLabel="Subtotal / mes"
                subtotal={plan.monthlyCOP}
                ivaAmount={iva}
                totalLabel="Total / mes"
                total={plan.monthlyCOP + iva}
            />
        </OrderSummaryShell>
    );
}

// ── Step 1: Plan selection ────────────────────────────────────────────────────

function Step1({ selected, onSelect }: { selected: string; onSelect: (s: string) => void }) {
    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--clr-text,#111827)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Selecciona tu licencia SST</h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 24px' }}>Suscripción mensual · Certificados incluidos · Cancela cuando quieras.</p>
            <div style={{ display: 'grid', gap: 10 }}>
                {sstConLicenciaPlans.map(plan => {
                    const active = selected === plan.slug;
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
                                <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--clr-text,#111827)' }}>{fmt(plan.monthlyCOP)}</div>
                                <div style={{ fontSize: 11, color: 'var(--clr-text-muted,#6b7280)' }}>COP/mes</div>
                            </div>
                        </SelectableOption>
                    );
                })}
            </div>
        </div>
    );
}

// ── Step 2: Personal data ─────────────────────────────────────────────────────

interface PersonalForm { nombreCompleto: string; cedula: string; email: string; telefono: string; profesion: string; departamento: string; ciudad: string; }
type PersonalErrors = Partial<Record<keyof PersonalForm, string>>;
const emptyPersonal: PersonalForm = { nombreCompleto: '', cedula: '', email: '', telefono: '', profesion: '', departamento: '', ciudad: '' };

function validatePersonalForm(form: PersonalForm): PersonalErrors {
    const errs: PersonalErrors = {};
    if (!form.nombreCompleto.trim()) errs.nombreCompleto = 'Campo requerido';
    const cedErr = validateCedula(form.cedula); if (cedErr) errs.cedula = cedErr;
    const emailErr = validateEmail(form.email); if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(form.telefono); if (phoneErr) errs.telefono = phoneErr;
    if (!form.profesion.trim()) errs.profesion = 'Campo requerido';
    if (!form.departamento) errs.departamento = 'Campo requerido';
    if (!form.ciudad.trim()) errs.ciudad = 'Campo requerido';
    return errs;
}

function Step2({ form, setForm, errors, accountData, setAccountData, accountErrors }: {
    form: PersonalForm; setForm: (f: PersonalForm) => void;
    errors: PersonalErrors;
    accountData: AccountData; setAccountData: (d: AccountData) => void;
    accountErrors: AccountErrors;
}) {
    const s = (k: keyof PersonalForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
    const municipios = getMunicipalities(form.departamento);
    const isExisting = accountData.mode === 'existing';

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--clr-text,#111827)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {isExisting ? 'Acceso a tu cuenta' : 'Datos personales'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 24px' }}>
                {isExisting ? 'Inicia sesión para vincular esta compra a tu cuenta existente.' : 'Todos los campos son requeridos para activar tu licencia.'}
            </p>
            {!isExisting && (
                <div style={{ display: 'grid', gap: 16 }}>
                    <Field label="Nombre completo" required error={errors.nombreCompleto}>
                        <Input value={form.nombreCompleto} onChange={s('nombreCompleto')} placeholder="María García López" />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Cédula de ciudadanía" required error={errors.cedula}>
                            <Input value={form.cedula} onChange={s('cedula')} placeholder="1000000000" />
                        </Field>
                        <Field label="Teléfono" required error={errors.telefono}>
                            <Input value={form.telefono} onChange={s('telefono')} placeholder="3001234567" />
                        </Field>
                    </div>
                    <Field label="Correo electrónico" required error={errors.email}>
                        <Input type="email" value={form.email} onChange={s('email')} placeholder="nombre@email.com" />
                    </Field>
                    <Field label="Profesión u ocupación" required error={errors.profesion}>
                        <Input value={form.profesion} onChange={s('profesion')} placeholder="Paramédico, Médico, Enfermero…" />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                    </div>
                </div>
            )}
            <AccountAccessSection email={isExisting ? '' : form.email} data={accountData} setData={setAccountData} errors={accountErrors} />
        </div>
    );
}

// ── Step 3: Payment ───────────────────────────────────────────────────────────

function Step3({ planSlug, personalForm, processing, paySubmitRef, onBack, onPay }: {
    planSlug: string; personalForm: PersonalForm;
    processing: boolean;
    paySubmitRef: { current: (() => void) | null };
    onBack: () => void;
    onPay: (method: PayMethod, card: CardData, pse: PseData) => void;
}) {
    const plan = sstConLicenciaPlans.find(p => p.slug === planSlug) ?? sstConLicenciaPlans[0];
    const total = Math.round(plan.monthlyCOP * (1 + IVA_RATE));
    return (
        <PaymentForm
            payLabel={`Activar licencia — ${fmt(total)} COP/mes`}
            processing={processing}
            onBack={onBack}
            onPay={onPay}
            submitRef={paySubmitRef}
            summaryContent={
                <PaymentSummaryBox
                    rows={[
                        { label: 'Plan', value: plan.name },
                        { label: 'Asignada a', value: personalForm.email },
                    ]}
                    totalLabel="Total / mes"
                    total={fmt(total)}
                />
            }
        />
    );
}

// ── Duplicate check ───────────────────────────────────────────────────────────

async function checkDuplicateSSTEmail(email: string): Promise<boolean> {
    const snap = await getDocs(query(collection(db, 'orders'), where('userEmail', '==', email.toLowerCase())));
    const active = new Set(['pending_payment', 'active', 'paid']);
    return snap.docs.some(d => { const data = d.data(); return data.type === 'licencia-sst' && active.has(data.status); });
}

// ── Page ──────────────────────────────────────────────────────────────────────

function Content() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') ?? sstConLicenciaPlans[0].slug);
    const [personalForm, setPersonalForm] = useState<PersonalForm>(emptyPersonal);
    const [personalErrors, setPersonalErrors] = useState<PersonalErrors>({});
    const [accountData, setAccountData] = useState<AccountData>(emptyAccountData);
    const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
    const [checking, setChecking] = useState(false);
    const [processing, setProcessing] = useState(false);
    const paySubmitRef = useRef<(() => void) | null>(null);

    const plan = sstConLicenciaPlans.find(p => p.slug === selectedPlan) ?? sstConLicenciaPlans[0];
    const total = Math.round(plan.monthlyCOP * (1 + IVA_RATE));

    const handleStep2Next = async () => {
        if (accountData.mode === 'existing') {
            const accErrs = validateAccount('', accountData);
            setAccountErrors(accErrs);
            if (Object.keys(accErrs).length > 0) return;
            setStep(2);
            return;
        }
        const formErrs = validatePersonalForm(personalForm);
        const accErrs = validateAccount(personalForm.email, accountData);
        setPersonalErrors(formErrs);
        setAccountErrors(accErrs);
        if (Object.keys(formErrs).length > 0 || Object.keys(accErrs).length > 0) return;
        setChecking(true);
        try {
            if (await checkDuplicateSSTEmail(personalForm.email)) {
                toast.error('Ya existe una licencia SST activa o pendiente para este correo.');
                return;
            }
            setStep(2);
        } catch {
            setStep(2);
        } finally {
            setChecking(false);
        }
    };

    const handlePay = async (method: PayMethod, card: CardData, pse: PseData) => {
        setProcessing(true);
        try {
            await addDoc(collection(db, 'orders'), {
                type: 'licencia-sst',
                planSlug: plan.slug,
                planName: plan.name,
                userEmail: personalForm.email,
                personal: personalForm,
                payMethod: method,
                cardLast4: method === 'card' ? card.numero.replace(/\s/g, '').slice(-4) : null,
                bank: method === 'pse' ? pse.banco : null,
                totalCOP: total,
                status: 'pending_payment',
                createdAt: serverTimestamp(),
            });
        } catch {
            // Order save failed (e.g. permissions in demo); proceed to result anyway
        }
        router.push(`/checkout/resultado?type=licencia-sst&plan=${selectedPlan}&status=approved`);
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
                style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: processing ? 0.75 : 1, background: processing ? '#4b5563' : undefined, transition: 'background 0.2s, opacity 0.2s' }}
            >
                {processing ? <>{spinner} Procesando…</> : <><Lock size={14} /> Pagar {fmt(total)} COP/mes</>}
            </button>
        ) : null;

    const steps: Record<number, React.ReactNode> = {
        0: <Step1 selected={selectedPlan} onSelect={setSelectedPlan} />,
        1: <Step2 form={personalForm} setForm={setPersonalForm} errors={personalErrors} accountData={accountData} setAccountData={setAccountData} accountErrors={accountErrors} />,
        2: <Step3 planSlug={selectedPlan} personalForm={personalForm} processing={processing} paySubmitRef={paySubmitRef} onBack={() => setStep(1)} onPay={handlePay} />,
    };

    return (
        <CheckoutLayout
            eyebrow="Adquisición de licencia"
            title="Licencias SST SIERCP"
            currentStep={step}
            stepLabels={['Licencia', 'Datos', 'Pago']}
            formContent={steps[step]}
            summary={<OrderSummary planSlug={selectedPlan} footerContent={summaryFooter} />}
        />
    );
}

export default function LicenciaSSTPage() {
    return (
        <Suspense fallback={<CheckoutSuspenseFallback />}>
            <Content />
        </Suspense>
    );
}
