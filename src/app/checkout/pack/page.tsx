'use client';

import { Suspense, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { sstSinLicenciaPlans } from '@/data/planes';
import { ChevronRight, ShieldCheck, Lock } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
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

function OrderSummary({ packSlug, footerContent }: { packSlug: string; footerContent?: React.ReactNode }) {
    const pack = sstSinLicenciaPlans.find(p => p.slug === packSlug) ?? sstSinLicenciaPlans[0];
    const iva = Math.round(pack.monthlyCOP * IVA_RATE);
    return (
        <OrderSummaryShell
            title="Resumen"
            badge={<SummaryBadge color="amber" icon={<ShieldCheck size={13} />}>Pago único · no se renueva automáticamente</SummaryBadge>}
            footerContent={footerContent}
        >
            <SummaryProductCard
                name={pack.name}
                desc={pack.desc}
                badge={<span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>Pago único · sin renovación</span>}
            />
            <SummaryFeatureList features={pack.features.filter(f => f.included).slice(0, 6).map(f => f.text)} />
            <SummaryPriceBlock
                subtotalLabel="Subtotal"
                subtotal={pack.monthlyCOP}
                ivaAmount={iva}
                totalLabel="Total"
                total={pack.monthlyCOP + iva}
            />
        </OrderSummaryShell>
    );
}

// ── Step 1: Pack selection ────────────────────────────────────────────────────

function Step1({ selected, onSelect }: { selected: string; onSelect: (s: string) => void }) {
    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--clr-text,#111827)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Selecciona tu pack</h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 24px' }}>Créditos de certificación SST · Pago único · Sin suscripción.</p>
            <div style={{ display: 'grid', gap: 10 }}>
                {sstSinLicenciaPlans.map(pack => {
                    const active = selected === pack.slug;
                    return (
                        <SelectableOption key={pack.slug} active={active} onClick={() => onSelect(pack.slug)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <RadioDot active={active} />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--clr-text,#111827)' }}>{pack.name}</span>
                                        {pack.badge && <OptionBadge>{pack.badge}</OptionBadge>}
                                    </div>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--clr-text-muted,#6b7280)' }}>{pack.desc}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--clr-text,#111827)' }}>{fmt(pack.monthlyCOP)}</div>
                                <div style={{ fontSize: 11, color: 'var(--clr-text-muted,#6b7280)' }}>COP</div>
                            </div>
                        </SelectableOption>
                    );
                })}
            </div>
        </div>
    );
}

// ── Step 2: Personal data ─────────────────────────────────────────────────────

interface PersonalForm { nombreCompleto: string; tipoDocumento: string; cedula: string; email: string; telefono: string; departamento: string; ciudad: string; }
type PersonalErrors = Partial<Record<keyof PersonalForm, string>>;
const emptyPersonal: PersonalForm = { nombreCompleto: '', tipoDocumento: 'CC', cedula: '', email: '', telefono: '', departamento: '', ciudad: '' };

function validatePersonalForm(form: PersonalForm): PersonalErrors {
    const errs: PersonalErrors = {};
    if (!form.nombreCompleto.trim()) errs.nombreCompleto = 'Campo requerido';
    const cedErr = validateCedula(form.cedula); if (cedErr) errs.cedula = cedErr;
    const emailErr = validateEmail(form.email); if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(form.telefono); if (phoneErr) errs.telefono = phoneErr;
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
                {isExisting ? 'Acceso a tu cuenta' : 'Datos del comprador'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 24px' }}>
                {isExisting ? 'Inicia sesión para vincular esta compra a tu cuenta existente.' : 'Todos los campos son requeridos para activar tus créditos.'}
            </p>
            {!isExisting && (
                <div style={{ display: 'grid', gap: 16 }}>
                    <Field label="Nombre completo" required error={errors.nombreCompleto}>
                        <Input value={form.nombreCompleto} onChange={s('nombreCompleto')} placeholder="María García López" />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Tipo de documento" required error={errors.tipoDocumento}>
                            <select
                                value={form.tipoDocumento}
                                onChange={e => setForm({ ...form, tipoDocumento: e.target.value })}
                                style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid var(--clr-border,#e5e7eb)', background: 'var(--clr-bg,#fff)', padding: '0 12px', fontSize: 14 }}
                            >
                                <option value="CC">CC — Cédula de Ciudadanía</option>
                                <option value="CE">CE — Cédula de Extranjería</option>
                                <option value="TI">TI — Tarjeta de Identidad</option>
                                <option value="PP">PP — Pasaporte</option>
                                <option value="NIT">NIT</option>
                                <option value="DIE">DIE — Doc. Identidad Extranjero</option>
                            </select>
                        </Field>
                        <Field label="Número de documento" required error={errors.cedula}>
                            <Input value={form.cedula} onChange={s('cedula')} placeholder="Número" />
                        </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Teléfono" required error={errors.telefono}>
                            <Input value={form.telefono} onChange={s('telefono')} placeholder="3001234567" />
                        </Field>
                        <div />{/* espaciador */}
                    </div>
                    <Field label="Correo electrónico" required error={errors.email}>
                        <Input type="email" value={form.email} onChange={s('email')} placeholder="nombre@email.com" />
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

function Step3({ packSlug, personalForm, processing, paySubmitRef, onBack, onPay }: {
    packSlug: string; personalForm: PersonalForm;
    processing: boolean;
    paySubmitRef: { current: (() => void) | null };
    onBack: () => void;
    onPay: (method: PayMethod, card: CardData, pse: PseData) => void;
}) {
    const pack = sstSinLicenciaPlans.find(p => p.slug === packSlug) ?? sstSinLicenciaPlans[0];
    const total = Math.round(pack.monthlyCOP * (1 + IVA_RATE));
    return (
        <PaymentForm
            payLabel={`Comprar pack — ${fmt(total)} COP`}
            processing={processing}
            onBack={onBack}
            onPay={onPay}
            submitRef={paySubmitRef}
            summaryContent={
                <PaymentSummaryBox
                    rows={[
                        { label: 'Pack', value: pack.name },
                        { label: 'Asignado a', value: personalForm.email },
                    ]}
                    totalLabel="Total a pagar"
                    total={fmt(total)}
                />
            }
        />
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function Content() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [selectedPack, setSelectedPack] = useState(searchParams.get('pack') ?? sstSinLicenciaPlans[0].slug);
    const [personalForm, setPersonalForm] = useState<PersonalForm>(emptyPersonal);
    const [personalErrors, setPersonalErrors] = useState<PersonalErrors>({});
    const [accountData, setAccountData] = useState<AccountData>(emptyAccountData);
    const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
    const [processing, setProcessing] = useState(false);
    const paySubmitRef = useRef<(() => void) | null>(null);

    const pack = sstSinLicenciaPlans.find(p => p.slug === selectedPack) ?? sstSinLicenciaPlans[0];
    const total = Math.round(pack.monthlyCOP * (1 + IVA_RATE));

    const handleStep2Next = () => {
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
        setStep(2);
    };

    const handlePay = async (method: PayMethod, card: CardData, pse: PseData) => {
        setProcessing(true);
        try {
            await addDoc(collection(db, 'orders'), {
                type: 'pack-sst',
                packSlug: pack.slug,
                packName: pack.name,
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
        router.push(`/checkout/resultado?type=pack&pack=${selectedPack}&status=approved`);
    };

    const spinner = <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;

    const summaryFooter =
        step === 0 ? (
            <button onClick={() => setStep(1)} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
                Continuar <ChevronRight size={15} />
            </button>
        ) : step === 1 ? (
            <div style={{ display: 'grid', gap: 8 }}>
                <button onClick={handleStep2Next} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
                    <span>Continuar</span><ChevronRight size={15} />
                </button>
                <button onClick={() => setStep(0)} style={{ ...btnSecondary, width: '100%', justifyContent: 'center' }}>Atrás</button>
            </div>
        ) : step === 2 ? (
            <button
                onClick={() => paySubmitRef.current?.()}
                disabled={processing}
                style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: processing ? 0.75 : 1, background: processing ? '#4b5563' : undefined, transition: 'background 0.2s, opacity 0.2s' }}
            >
                {processing ? <>{spinner} Procesando…</> : <><Lock size={14} /> Pagar {fmt(total)} COP</>}
            </button>
        ) : null;

    const steps: Record<number, React.ReactNode> = {
        0: <Step1 selected={selectedPack} onSelect={setSelectedPack} />,
        1: <Step2 form={personalForm} setForm={setPersonalForm} errors={personalErrors} accountData={accountData} setAccountData={setAccountData} accountErrors={accountErrors} />,
        2: <Step3 packSlug={selectedPack} personalForm={personalForm} processing={processing} paySubmitRef={paySubmitRef} onBack={() => setStep(1)} onPay={handlePay} />,
    };

    return (
        <CheckoutLayout
            eyebrow="Packs de certificados"
            title="Packs SST sin licencia"
            currentStep={step}
            stepLabels={['Pack', 'Datos', 'Pago']}
            formContent={steps[step]}
            summary={<OrderSummary packSlug={selectedPack} footerContent={summaryFooter} />}
        />
    );
}

export default function PackCheckoutPage() {
    return (
        <Suspense fallback={<CheckoutSuspenseFallback />}>
            <Content />
        </Suspense>
    );
}
