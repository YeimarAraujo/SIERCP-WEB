'use client';

import { Suspense, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/page/Navbar';
import Footer from '@/components/page/Footer';
import { maniquiPackages } from '@/data/planes';
import { ChevronRight, ShieldCheck, Building2, User, Lock } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { fmt, validateEmail, validatePhone, validateNIT, IVA_RATE } from '../_lib';
import {
    Field, Input, SelectInput,
    AccountAccessSection, validateAccount, type AccountData, type AccountErrors, emptyAccountData,
    CheckoutLayout, CheckoutSuspenseFallback, PaymentForm, PaymentSummaryBox,
    OrderSummaryShell, SummaryProductCard, SummaryFeatureList, SummaryPriceBlock, SummaryBadge,
    SelectableOption, RadioDot, OptionBadge,
    btnPrimary, btnSecondary,
    type PayMethod, type CardData, type PseData,
} from '../_components/ui';

const DEPARTMENTS = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
    'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare',
    'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
    'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
];

// ── Order summary ─────────────────────────────────────────────────────────────

function OrderSummary({ packSlug, footerContent }: { packSlug: string; footerContent?: React.ReactNode }) {
    const pkg = maniquiPackages.find(p => p.slug === packSlug) ?? maniquiPackages[0];
    const base = pkg.totalPriceCOP ?? 0;
    const iva = Math.round(base * IVA_RATE);
    return (
        <OrderSummaryShell
            badge={<SummaryBadge color="green" icon={<ShieldCheck size={13} />}>Pago único · envío gratis a Colombia</SummaryBadge>}
            footerContent={footerContent}
        >
            <SummaryProductCard
                name={pkg.name}
                desc={pkg.desc}
                badge={pkg.quantity ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-primary,#2563eb)' }}>
                        {pkg.quantity} maniquí{pkg.quantity > 1 ? 'es' : ''} SIERCP IoT
                    </span>
                ) : undefined}
            />
            <SummaryFeatureList features={pkg.includes.slice(0, 5)} />
            <SummaryPriceBlock
                subtotalLabel="Subtotal"
                subtotal={base}
                ivaAmount={iva}
                totalLabel="Total"
                total={base + iva}
                extras={pkg.discountPercent > 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#059669', fontWeight: 700 }}>
                        <span>Descuento {pkg.discountPercent}%</span><span>Incluido</span>
                    </div>
                ) : undefined}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                <span>Envío Colombia</span><span>Gratis</span>
            </div>
        </OrderSummaryShell>
    );
}

// ── Step 1: Pack selection ────────────────────────────────────────────────────

function Step1({ selected, onSelect }: { selected: string; onSelect: (s: string) => void }) {
    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--clr-text,#111827)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Selecciona tu pack</h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 24px' }}>Maniquíes IoT SIERCP · Pago único · Envío a Colombia.</p>
            <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                {maniquiPackages.filter(p => p.totalPriceCOP !== null).map(pkg => {
                    const active = selected === pkg.slug;
                    return (
                        <SelectableOption key={pkg.slug} active={active} onClick={() => onSelect(pkg.slug)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <RadioDot active={active} />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--clr-text,#111827)' }}>{pkg.name}</span>
                                        {pkg.badge && <OptionBadge>{pkg.badge}</OptionBadge>}
                                    </div>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--clr-text-muted,#6b7280)' }}>{pkg.desc}</p>
                                    {pkg.discountPercent > 0 && <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#059669' }}>Ahorro {pkg.discountPercent}% incluido</p>}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--clr-text,#111827)' }}>{fmt(pkg.totalPriceCOP ?? 0)}</div>
                                {pkg.quantity && <div style={{ fontSize: 11, color: 'var(--clr-text-muted,#6b7280)' }}>{pkg.quantity} ud{pkg.quantity > 1 ? 's' : ''}.</div>}
                            </div>
                        </SelectableOption>
                    );
                })}
                <div style={{ padding: '14px 18px', borderRadius: 12, border: '1.5px dashed var(--clr-border,#d1d5db)', background: 'var(--clr-bg-muted,#fafafa)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--clr-text-secondary,#374151)' }}>12+ maniquíes</div>
                        <div style={{ fontSize: 12, color: 'var(--clr-text-muted,#9ca3af)', marginTop: 1 }}>Cotización personalizada · descuento garantizado</div>
                    </div>
                    <a href="/#contacto" style={{ ...btnSecondary, fontSize: 12, padding: '8px 14px', textDecoration: 'none' }}>Solicitar cotización</a>
                </div>
            </div>
        </div>
    );
}

// ── Step 2: Buyer data ────────────────────────────────────────────────────────

type BuyerType = 'empresa' | 'persona';
interface EmpresaForm { razonSocial: string; nit: string; responsable: string; cargo: string; email: string; telefono: string; }
interface PersonaForm { nombre: string; cedula: string; email: string; telefono: string; }
type EmpresaErrors = Partial<Record<keyof EmpresaForm, string>>;
type PersonaErrors = Partial<Record<keyof PersonaForm, string>>;
const emptyEmpresa: EmpresaForm = { razonSocial: '', nit: '', responsable: '', cargo: '', email: '', telefono: '' };
const emptyPersona: PersonaForm = { nombre: '', cedula: '', email: '', telefono: '' };

function validateBuyerForms(buyerType: BuyerType, empresa: EmpresaForm, persona: PersonaForm) {
    const eErrs: EmpresaErrors = {};
    const pErrs: PersonaErrors = {};
    if (buyerType === 'empresa') {
        if (!empresa.razonSocial.trim()) eErrs.razonSocial = 'Campo requerido';
        const nitErr = validateNIT(empresa.nit); if (nitErr) eErrs.nit = nitErr;
        if (!empresa.responsable.trim()) eErrs.responsable = 'Campo requerido';
        if (!empresa.cargo.trim()) eErrs.cargo = 'Campo requerido';
        const emailErr = validateEmail(empresa.email); if (emailErr) eErrs.email = emailErr;
        const phoneErr = validatePhone(empresa.telefono); if (phoneErr) eErrs.telefono = phoneErr;
    } else {
        if (!persona.nombre.trim()) pErrs.nombre = 'Campo requerido';
        if (!persona.cedula.trim()) pErrs.cedula = 'Cédula requerida';
        const emailErr = validateEmail(persona.email); if (emailErr) pErrs.email = emailErr;
        const phoneErr = validatePhone(persona.telefono); if (phoneErr) pErrs.telefono = phoneErr;
    }
    return { eErrs, pErrs, hasErrors: Object.keys(eErrs).length > 0 || Object.keys(pErrs).length > 0 };
}

function Step2({ buyerType, setBuyerType, empresa, setEmpresa, persona, setPersona, eErrors, pErrors, accountData, setAccountData, accountErrors }: {
    buyerType: BuyerType; setBuyerType: (t: BuyerType) => void;
    empresa: EmpresaForm; setEmpresa: (f: EmpresaForm) => void;
    persona: PersonaForm; setPersona: (f: PersonaForm) => void;
    eErrors: EmpresaErrors; pErrors: PersonaErrors;
    accountData: AccountData; setAccountData: (d: AccountData) => void;
    accountErrors: AccountErrors;
}) {
    const fe = (k: keyof EmpresaForm) => (e: React.ChangeEvent<HTMLInputElement>) => setEmpresa({ ...empresa, [k]: e.target.value });
    const fp = (k: keyof PersonaForm) => (e: React.ChangeEvent<HTMLInputElement>) => setPersona({ ...persona, [k]: e.target.value });
    const currentEmail = buyerType === 'empresa' ? empresa.email : persona.email;
    const isExisting = accountData.mode === 'existing';

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--clr-text,#111827)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {isExisting ? 'Acceso a tu cuenta' : 'Datos del comprador'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 20px' }}>
                {isExisting ? 'Inicia sesión para vincular esta compra a tu cuenta existente.' : 'Usados para facturación y gestión del pedido.'}
            </p>

            {!isExisting && (
                <>
                    <div style={{ display: 'flex', marginBottom: 24, border: '1.5px solid var(--clr-border,#e5e7eb)', borderRadius: 12, overflow: 'hidden', width: 'fit-content' }}>
                        {([['empresa', 'Empresa / Institución', Building2], ['persona', 'Persona natural', User]] as const).map(([type, label, Icon]) => (
                            <button key={type} onClick={() => setBuyerType(type as BuyerType)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: buyerType === type ? 'var(--clr-primary,#2563eb)' : 'var(--clr-bg-card,#fff)', color: buyerType === type ? '#fff' : 'var(--clr-text-muted,#6b7280)', transition: 'all 0.15s' }}>
                                <Icon size={14} />{label}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gap: 14 }}>
                        {buyerType === 'empresa' ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <Field label="Razón social" required error={eErrors.razonSocial}><Input value={empresa.razonSocial} onChange={fe('razonSocial')} placeholder="Empresa S.A.S." /></Field>
                                    <Field label="NIT" required error={eErrors.nit}><Input value={empresa.nit} onChange={fe('nit')} placeholder="900000000" /></Field>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <Field label="Responsable" required error={eErrors.responsable}><Input value={empresa.responsable} onChange={fe('responsable')} placeholder="Nombre completo" /></Field>
                                    <Field label="Cargo" required error={eErrors.cargo}><Input value={empresa.cargo} onChange={fe('cargo')} placeholder="Coordinador SST" /></Field>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <Field label="Correo corporativo" required error={eErrors.email}><Input type="email" value={empresa.email} onChange={fe('email')} placeholder="empresa@email.co" /></Field>
                                    <Field label="Teléfono" required error={eErrors.telefono}><Input value={empresa.telefono} onChange={fe('telefono')} placeholder="3001234567" /></Field>
                                </div>
                            </>
                        ) : (
                            <>
                                <Field label="Nombre completo" required error={pErrors.nombre}><Input value={persona.nombre} onChange={fp('nombre')} placeholder="María García López" /></Field>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <Field label="Cédula" required error={pErrors.cedula}><Input value={persona.cedula} onChange={fp('cedula')} placeholder="1000000000" /></Field>
                                    <Field label="Teléfono" required error={pErrors.telefono}><Input value={persona.telefono} onChange={fp('telefono')} placeholder="3001234567" /></Field>
                                </div>
                                <Field label="Correo" required error={pErrors.email}><Input type="email" value={persona.email} onChange={fp('email')} placeholder="nombre@email.com" /></Field>
                            </>
                        )}
                    </div>
                </>
            )}
            <AccountAccessSection email={isExisting ? '' : currentEmail} data={accountData} setData={setAccountData} errors={accountErrors} />
        </div>
    );
}

// ── Step 3: Shipping ──────────────────────────────────────────────────────────

interface ShippingForm { address: string; city: string; department: string; postalCode: string; }
type ShippingErrors = Partial<Record<'address' | 'city' | 'department', string>>;
const emptyShipping: ShippingForm = { address: '', city: '', department: '', postalCode: '' };

function validateShippingForm(form: ShippingForm): ShippingErrors {
    const errs: ShippingErrors = {};
    if (!form.address.trim()) errs.address = 'Dirección requerida';
    if (!form.city.trim()) errs.city = 'Ciudad requerida';
    if (!form.department) errs.department = 'Selecciona un departamento';
    return errs;
}

function Step3({ form, setForm, errors }: { form: ShippingForm; setForm: (f: ShippingForm) => void; errors: ShippingErrors }) {
    const f = (k: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--clr-text,#111827)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Dirección de entrega</h2>
            <p style={{ fontSize: 14, color: 'var(--clr-text-muted,#6b7280)', margin: '0 0 24px' }}>Solo realizamos envíos a Colombia. Envío completamente gratuito.</p>
            <div style={{ display: 'grid', gap: 14 }}>
                <Field label="Dirección" required error={errors.address}>
                    <Input value={form.address} onChange={f('address')} placeholder="Cra. 15 # 93-47, Oficina 201" />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Departamento" required error={errors.department}>
                        <SelectInput value={form.department} onChange={f('department')}>
                            <option value="">Selecciona…</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </SelectInput>
                    </Field>
                    <Field label="Ciudad" required error={errors.city}>
                        <Input value={form.city} onChange={f('city')} placeholder="Bogotá" />
                    </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="País">
                        <input value="Colombia 🇨🇴" readOnly style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--clr-border,#e5e7eb)', background: 'var(--clr-bg-muted,#f9fafb)', color: 'var(--clr-text-muted,#9ca3af)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </Field>
                    <Field label="Código postal">
                        <Input value={form.postalCode} onChange={f('postalCode')} placeholder="110111" />
                    </Field>
                </div>
            </div>
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', fontSize: 13, color: '#065f46' }}>
                Tiempo estimado: <strong>5–10 días hábiles</strong> después de confirmar el pago.
            </div>
        </div>
    );
}

// ── Step 4: Payment ───────────────────────────────────────────────────────────

function Step4({ packSlug, buyerType, empresa, persona, shipping, processing, paySubmitRef, onBack, onPay }: {
    packSlug: string; buyerType: BuyerType;
    empresa: EmpresaForm; persona: PersonaForm;
    shipping: ShippingForm;
    processing: boolean;
    paySubmitRef: { current: (() => void) | null };
    onBack: () => void;
    onPay: (method: PayMethod, card: CardData, pse: PseData) => void;
}) {
    const pkg = maniquiPackages.find(p => p.slug === packSlug) ?? maniquiPackages[0];
    const base = pkg.totalPriceCOP ?? 0;
    const total = Math.round(base * (1 + IVA_RATE));
    const buyerName = buyerType === 'empresa' ? empresa.razonSocial : persona.nombre;

    return (
        <PaymentForm
            payLabel={`Pagar ${fmt(total)} COP`}
            processing={processing}
            onBack={onBack}
            onPay={onPay}
            submitRef={paySubmitRef}
            summaryContent={
                <PaymentSummaryBox
                    rows={[
                        { label: 'Pack', value: pkg.name },
                        { label: 'Comprador', value: buyerName },
                        { label: 'Envío', value: 'Gratis', green: true },
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
    const [selectedPack, setSelectedPack] = useState(searchParams.get('pack') ?? maniquiPackages.find(p => p.totalPriceCOP !== null)?.slug ?? '');
    const [buyerType, setBuyerType] = useState<BuyerType>('empresa');
    const [empresa, setEmpresa] = useState<EmpresaForm>(emptyEmpresa);
    const [persona, setPersona] = useState<PersonaForm>(emptyPersona);
    const [eErrors, setEErrors] = useState<EmpresaErrors>({});
    const [pErrors, setPErrors] = useState<PersonaErrors>({});
    const [accountData, setAccountData] = useState<AccountData>(emptyAccountData);
    const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
    const [shipping, setShipping] = useState<ShippingForm>(emptyShipping);
    const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});
    const [processing, setProcessing] = useState(false);
    const paySubmitRef = useRef<(() => void) | null>(null);

    const pkg = maniquiPackages.find(p => p.slug === selectedPack) ?? maniquiPackages[0];
    const base = pkg.totalPriceCOP ?? 0;
    const total = Math.round(base * (1 + IVA_RATE));
    const currentEmail = buyerType === 'empresa' ? empresa.email : persona.email;

    const handleStep2Next = () => {
        if (accountData.mode === 'existing') {
            const accErrs = validateAccount('', accountData);
            setAccountErrors(accErrs);
            if (Object.keys(accErrs).length > 0) return;
            setStep(2);
            return;
        }
        const { eErrs, pErrs, hasErrors } = validateBuyerForms(buyerType, empresa, persona);
        const accErrs = validateAccount(currentEmail, accountData);
        setEErrors(eErrs);
        setPErrors(pErrs);
        setAccountErrors(accErrs);
        if (hasErrors || Object.keys(accErrs).length > 0) return;
        setStep(2);
    };

    const handleStep3Next = () => {
        const errs = validateShippingForm(shipping);
        setShippingErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setStep(3);
    };

    const handlePay = async (method: PayMethod, card: CardData, pse: PseData) => {
        setProcessing(true);
        try {
            await addDoc(collection(db, 'orders'), {
                type: 'manikin',
                packSlug: pkg.slug,
                packName: pkg.name,
                quantity: pkg.quantity ?? 1,
                buyerType,
                buyer: buyerType === 'empresa' ? empresa : persona,
                buyerEmail: currentEmail,
                shipping,
                payMethod: method,
                cardLast4: method === 'card' ? card.numero.replace(/\s/g, '').slice(-4) : null,
                bank: method === 'pse' ? pse.banco : null,
                totalCOP: total,
                status: 'pending_payment',
                shippingStatus: 'pending',
                createdAt: serverTimestamp(),
            });
        } catch {
            // Order save failed (e.g. permissions in demo); proceed to result anyway
        }
        router.push(`/checkout/resultado?type=manikin&pack=${selectedPack}&status=approved`);
    };

    if (pkg.totalPriceCOP === null) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--clr-bg,#f8fafc)' }}>
                <Navbar />
                <main style={{ maxWidth: 560, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
                    <div style={{ fontSize: 44, marginBottom: 16 }}>🤝</div>
                    <h1 style={{ fontWeight: 900, fontSize: 26, color: 'var(--clr-text,#111827)', marginBottom: 10 }}>Pack empresarial</h1>
                    <p style={{ color: 'var(--clr-text-muted,#6b7280)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                        Para 12 o más maniquíes ofrecemos cotización personalizada con descuento &gt;30%, instalación presencial y SLA dedicado.
                    </p>
                    <a href="/#contacto" style={{ ...btnPrimary, textDecoration: 'none' }}>Solicitar cotización</a>
                </main>
                <Footer />
            </div>
        );
    }

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
            <div style={{ display: 'grid', gap: 8 }}>
                <button onClick={handleStep3Next} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
                    <span>Continuar</span><ChevronRight size={15} />
                </button>
                <button onClick={() => setStep(1)} style={{ ...btnSecondary, width: '100%', justifyContent: 'center' }}>Atrás</button>
            </div>
        ) : step === 3 ? (
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
        1: <Step2
            buyerType={buyerType} setBuyerType={setBuyerType}
            empresa={empresa} setEmpresa={setEmpresa}
            persona={persona} setPersona={setPersona}
            eErrors={eErrors} pErrors={pErrors}
            accountData={accountData} setAccountData={setAccountData}
            accountErrors={accountErrors}
        />,
        2: <Step3 form={shipping} setForm={setShipping} errors={shippingErrors} />,
        3: <Step4
            packSlug={selectedPack} buyerType={buyerType}
            empresa={empresa} persona={persona}
            shipping={shipping}
            processing={processing}
            paySubmitRef={paySubmitRef}
            onBack={() => setStep(2)}
            onPay={handlePay}
        />,
    };

    return (
        <CheckoutLayout
            eyebrow="Compra de hardware"
            title="Maniquíes IoT SIERCP"
            currentStep={step}
            stepLabels={['Pack', 'Comprador', 'Envío', 'Pago']}
            formContent={steps[step]}
            summary={<OrderSummary packSlug={selectedPack} footerContent={summaryFooter} />}
        />
    );
}

export default function ManikinCheckoutPage() {
    return (
        <Suspense fallback={<CheckoutSuspenseFallback />}>
            <Content />
        </Suspense>
    );
}
