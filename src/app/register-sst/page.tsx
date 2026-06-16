'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/page/Navbar';
import toast from 'react-hot-toast';
import { COLOMBIA_DEPARTMENTS, getMunicipalities } from '@/data/colombia-geo';
import { SearchableSelect } from '@/app/checkout/_components/ui';

const PLAN_LABELS: Record<string, { name: string; price: string; certs: string }> = {
  'sst-basico': { name: 'SST Básico', price: '$150.000/mes', certs: '30 certificados/mes' },
  'sst-pro':    { name: 'SST Pro',    price: '$320.000/mes', certs: '100 certificados/mes' },
  'sst-expert': { name: 'SST Expert', price: '$580.000/mes', certs: 'Certificados ilimitados' },
};

function RegisterSSTContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') ?? 'sst-pro';
  const planInfo = PLAN_LABELS[planParam] ?? PLAN_LABELS['sst-pro'];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', identification: '', phoneNumber: '',
    email: '', password: '', confirm: '',
    licenseNumber: '', issuingEntity: '',
    departamento: '', ciudad: '', direccion: '',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1px solid var(--clr-border)', background: 'var(--clr-bg)',
    color: 'var(--clr-text)', fontSize: '0.9rem', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: 'var(--clr-text-head)',
    marginBottom: '5px', display: 'block',
  };

  function validate1() {
    if (!form.firstName || !form.lastName || !form.identification) {
      setError('Completa los datos personales');
      return false;
    }
    setError(null);
    return true;
  }

  function validate2() {
    if (!form.email || !form.password) {
      setError('Completa el correo y contraseña');
      return false;
    }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return false; }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return false; }
    setError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate2()) return;
    setLoading(true);
    setError(null);
    try {
      const { useAuthStore } = await import('@/features/auth/store/auth-store');
      await useAuthStore.getState().register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        identification: form.identification,
        phoneNumber: form.phoneNumber || undefined,
        role: 'INSTRUCTOR',
        address: form.direccion || undefined,
        city: form.ciudad || undefined,
        department: form.departamento || undefined,
        country: 'Colombia',
      });
      toast.success('Cuenta creada. Ahora sube tu licencia SST.');
      router.replace(`/instructor-apply?plan=${planParam}&from=sst-register`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--clr-bg)', minHeight: '100vh' }}>
      <Navbar forceScrolled />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '120px 24px 80px' }}>

        {/* Header */}
        <div className="text-center mb-5">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--clr-primary-alpha)', color: 'var(--clr-primary)',
            padding: '6px 18px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '16px',
          }}>
            <i className="bi bi-patch-check-fill" /> Profesional SST
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: 'var(--clr-text-head)', letterSpacing: '-1px', marginBottom: '10px' }}>
            Registro profesional SST
          </h1>
          <p style={{ color: 'var(--clr-muted)', fontSize: '0.95rem' }}>
            Crea tu cuenta y luego sube tu licencia SST para activar la emisión de certificados.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '14px',
            background: '#1800ad', color: '#fff', padding: '8px 20px', borderRadius: '100px',
            fontSize: '0.82rem', fontWeight: 800,
          }}>
            <i className="bi bi-tag-fill" />
            {planInfo.name} — {planInfo.price} · {planInfo.certs}
          </div>
        </div>

        {/* Steps */}
        <div className="d-flex align-items-center gap-3 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: s < 3 ? 1 : undefined }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: step >= s ? '#1800ad' : 'var(--clr-bg-surface)',
                border: step >= s ? 'none' : '2px solid var(--clr-border)',
                color: step >= s ? '#fff' : 'var(--clr-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 900, transition: 'all 0.3s',
              }}>
                {step > s ? <i className="bi bi-check-lg" /> : s}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: step >= s ? 'var(--clr-text-head)' : 'var(--clr-muted)', whiteSpace: 'nowrap' }}>
                {s === 1 ? 'Datos personales' : s === 2 ? 'Acceso' : 'Licencia SST'}
              </span>
              {s < 3 && <div style={{ flex: 1, height: '2px', background: step > s ? '#1800ad' : 'var(--clr-border)', transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="d-flex align-items-center gap-3 mb-4 px-4 py-3" style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '14px', color: '#ef4444', fontSize: '0.88rem',
          }}>
            <i className="bi bi-exclamation-circle-fill" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* STEP 1 — Datos personales */}
          {step === 1 && (
            <div style={{ background: 'var(--clr-bg-surface)', border: '1px solid var(--clr-border)', borderRadius: '24px', padding: '32px' }}>
              <h3 style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--clr-text-head)', marginBottom: '20px' }}>
                <i className="bi bi-person-fill me-2" style={{ color: '#1800ad' }} />
                Información personal
              </h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={labelStyle}>Nombre(s) *</label>
                  <input type="text" required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Ej: Carlos" style={inputStyle} />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Apellido(s) *</label>
                  <input type="text" required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Ej: Rodríguez" style={inputStyle} />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Documento de identidad *</label>
                  <input type="text" required value={form.identification} onChange={e => setForm(p => ({ ...p, identification: e.target.value }))} placeholder="Cédula / DNI" style={inputStyle} />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Teléfono / WhatsApp <span style={{ fontWeight: 400, color: 'var(--clr-muted)' }}>(opcional)</span></label>
                  <input type="tel" value={form.phoneNumber} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="+57 300 000 0000" style={inputStyle} />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Departamento <span style={{ fontWeight: 400, color: 'var(--clr-muted)' }}>(opcional)</span></label>
                  <SearchableSelect
                    value={form.departamento}
                    onChange={v => setForm(p => ({ ...p, departamento: v, ciudad: '' }))}
                    options={COLOMBIA_DEPARTMENTS}
                    placeholder="Buscar departamento…"
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Ciudad / Municipio <span style={{ fontWeight: 400, color: 'var(--clr-muted)' }}>(opcional)</span></label>
                  <SearchableSelect
                    value={form.ciudad}
                    onChange={v => setForm(p => ({ ...p, ciudad: v }))}
                    options={getMunicipalities(form.departamento)}
                    placeholder={form.departamento ? 'Buscar municipio…' : 'Selecciona un departamento'}
                    disabled={!form.departamento}
                  />
                </div>
                <div className="col-12">
                  <label style={labelStyle}>Dirección <span style={{ fontWeight: 400, color: 'var(--clr-muted)' }}>(opcional)</span></label>
                  <input type="text" value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} placeholder="Cra. 1 # 2-3, Barrio Centro" style={inputStyle} />
                </div>
              </div>
              <button type="button" onClick={() => validate1() && setStep(2)} style={{
                width: '100%', marginTop: '24px', padding: '14px', borderRadius: '14px',
                background: '#1800ad', color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                Siguiente <i className="bi bi-arrow-right" />
              </button>
            </div>
          )}

          {/* STEP 2 — Acceso */}
          {step === 2 && (
            <div style={{ background: 'var(--clr-bg-surface)', border: '1px solid var(--clr-border)', borderRadius: '24px', padding: '32px' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <button type="button" onClick={() => setStep(1)} style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <i className="bi bi-chevron-left" style={{ color: 'var(--clr-text)', fontSize: '0.8rem' }} />
                </button>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.05rem', color: 'var(--clr-text-head)' }}>
                  <i className="bi bi-lock-fill me-2" style={{ color: '#1800ad' }} />
                  Seguridad y acceso
                </h3>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label style={labelStyle}>Correo electrónico *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="profesional@correo.com" style={inputStyle} />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Contraseña *</label>
                  <input type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" style={inputStyle} />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Confirmar contraseña *</label>
                  <input type="password" required value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" style={inputStyle} />
                </div>
              </div>

              <div style={{
                marginTop: '20px', padding: '14px 18px', borderRadius: '14px',
                background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
              }}>
                <i className="bi bi-patch-check-fill" style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--clr-text)', lineHeight: 1.6 }}>
                  Al continuar, serás redirigido a la sección de <strong>subir licencia SST</strong>. Necesitarás tu licencia vigente y certificados profesionales para activar la emisión de certificados.
                </p>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', marginTop: '24px', padding: '14px', borderRadius: '14px',
                background: '#1800ad', color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm" /> Creando cuenta...</>
                  : <><i className="bi bi-person-plus-fill" /> Crear cuenta y subir licencia</>
                }
              </button>
            </div>
          )}
        </form>

        <p className="text-center mt-4" style={{ fontSize: '0.88rem', color: 'var(--clr-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#1800ad', fontWeight: 800 }}>Inicia sesión</Link>
          {' '}·{' '}
          <Link href="/planes" style={{ color: 'var(--clr-muted)' }}>Ver todos los planes</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterSSTPage() {
  return (
    <Suspense fallback={<div className="text-center py-5">Cargando...</div>}>
      <RegisterSSTContent />
    </Suspense>
  );
}
