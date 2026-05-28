'use client';

import { use, useEffect, useState } from 'react';
import { InstitutionService } from '@/services/institution.service';
import { PlanService } from '@/features/super-admin/services/plan.service';
import type { Institution, InstitutionMode, InstitutionStatus, InstitutionPlan, CreateInstitutionInput } from '@/shared/types/institution';
import type { Plan } from '@/shared/types/plan';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
  Building2, Plus, Users, Cpu, GraduationCap,
  CheckCircle2, AlertCircle, Clock, Zap, Settings, Search,
  X, CreditCard, ChevronDown, Pencil, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { UserModel } from '@/models';
import { UserService } from '@/services/firestore.service';
import { COLOMBIA_DEPARTMENTS, getMunicipalities } from '@/data/colombia-geo';
import { Field, SearchableSelect } from '@/app/checkout/_components/ui';
import { TIPOS_INSTITUCION } from '@/data/institutions';

const PLAN_META: Record<string, { label: string; bg: string; text: string }> = {
  pyme: { label: 'Pyme', bg: 'rgba(14,165,233,0.12)', text: '#0ea5e9' },
  business: { label: 'Business', bg: 'rgba(99,102,241,0.12)', text: '#6366F1' },
  corporate: { label: 'Corporate', bg: 'rgba(168,85,247,0.12)', text: '#a855f7' },
  enterprise: { label: 'Enterprise', bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
  sstSinLicencia: { label: 'SST Sin Lic.', bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  sstConLicencia: { label: 'SST Con Lic.', bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
};

function planMeta(slug: string | undefined) {
  const s = (slug || '').toLowerCase();
  return PLAN_META[s] ?? { label: slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '—', bg: 'var(--bg-surface-2)', text: 'var(--text-muted)' };
}

function formatPrice(priceCOP: number) {
  if (priceCOP === -1) return 'Contactar';
  if (priceCOP === 0) return 'Gratis';
  if (priceCOP >= 1000000) return `$${(priceCOP / 1000000).toFixed(1)}M/mes`;
  return `$${(priceCOP / 1000).toFixed(0)}K/mes`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'ACTIVA' },
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'PENDIENTE' },
    suspended: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'SUSPENDIDA' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      fontSize: 9, fontWeight: 900, padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color, letterSpacing: '0.05em',
    }}>{s.label}</span>
  );
}
// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
  border: '1px solid var(--border)', fontSize: 14, outline: 'none',
  background: 'var(--bg-surface-2)', color: 'var(--text-primary)', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6,
};
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 20px', borderRadius: 12, background: 'var(--brand)',
  color: 'var(--text-on-brand)', border: 'none', fontSize: 14, fontWeight: 700,
  cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 20px', borderRadius: 12, background: 'var(--bg-surface-2)',
  color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 14, fontWeight: 700,
  cursor: 'pointer',
};

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, backdropFilter: 'blur(4px)' }}
    />
  );
}

// ─── Assign Plan Modal ────────────────────────────────────────────────────────

function AssignPlanModal({ institution, plans, onClose, onSaved }: {
  institution: Institution; plans: Plan[];
  onClose: () => void; onSaved: (id: string, newPlan: string) => void;
}) {
  const [selected, setSelected] = useState<string>(institution.planType || 'pyme');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selected === institution.planType) { onClose(); return; }
    setSaving(true);
    try {
      if (!institution.id) {
        toast.error('La institución no tiene ID');
        return;
      }

      await InstitutionService.update(
        institution.id,
        {
          planType: selected,
        }
      );
      toast.success(`Plan actualizado a ${planMeta(selected).label}`);
      onSaved(institution.id, selected);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar el plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 480, maxHeight: '88vh', overflowY: 'auto',
        background: 'var(--bg-surface)', borderRadius: 24, padding: 28, zIndex: 201,
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Asignar plan</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{institution.name}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--bg-surface-2)', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {plans.map((plan) => {
            const meta = planMeta(plan.slug);
            const isSelected = selected === plan.slug;
            return (
              <div key={plan.slug} onClick={() => setSelected(plan.slug)} style={{
                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                background: isSelected ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'var(--bg-surface-2)',
                transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? 'var(--brand)' : 'var(--text-primary)' }}>{plan.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{plan.description}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: meta.text, minWidth: 80, textAlign: 'right' }}>
                  {formatPrice(plan.priceCOP)}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, width: '100%', height: 46, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Guardando...' : 'Confirmar plan'}
        </button>
      </div>
    </>
  );
}

// ─── Status change modal ──────────────────────────────────────────────────────

function ChangeStatusModal({ institution, onClose, onSaved }: {
  institution: Institution;
  onClose: () => void; onSaved: (id: string, newStatus: InstitutionStatus) => void;
}) {
  const [selected, setSelected] = useState<InstitutionStatus>(institution.status || 'pending');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selected === institution.status) { onClose(); return; }
    setSaving(true);
    try {
      if (!institution.id) {
        toast.error('La institución no tiene ID');
        return;
      }
      await InstitutionService.update(institution.id, { status: selected });
      toast.success('Estado actualizado');
      onSaved(institution.id, selected);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar el estado');
    } finally {
      setSaving(false);
    }
  };

  const options: { value: InstitutionStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Activa', color: '#10B981' },
    { value: 'pending', label: 'Pendiente', color: '#F59E0B' },
    { value: 'suspended', label: 'Suspendida', color: '#EF4444' },
  ];

  return (
    <>
      <Backdrop onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 360, background: 'var(--bg-surface)', borderRadius: 24, padding: 28, zIndex: 201,
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Cambiar estado</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--bg-surface-2)', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {options.map((opt) => (
            <div key={opt.value} onClick={() => setSelected(opt.value)} style={{
              padding: '12px 16px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              border: `2px solid ${selected === opt.value ? opt.color : 'var(--border)'}`,
              background: selected === opt.value ? `${opt.color}18` : 'var(--bg-surface-2)',
              transition: 'all 0.15s',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: opt.color }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: selected === opt.value ? opt.color : 'var(--text-primary)' }}>{opt.label}</span>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, width: '100%', height: 44, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Guardando...' : 'Confirmar'}
        </button>
      </div>
    </>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ institution, onClose, onSaved }: {
  institution: Institution; onClose: () => void; onSaved: () => void;
}) {
  const [admins, setAdmins] = useState<UserModel[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>(
    institution.adminIds || []);

  const [name, setName] = useState(institution.name || '');
  const [contactEmail, setContactEmail] = useState(institution.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(institution.contactPhone || '');
  const [mode, setMode] = useState<InstitutionMode>(institution.mode || 'MANUAL');
  const [maxStudents, setMaxStudents] = useState(String(institution.maxStudents ?? 100));
  const [maxInstructors, setMaxInstructors] = useState(String(institution.maxInstructors ?? 5));
  const [maxDevices, setMaxDevices] = useState(String(institution.maxDevices ?? 10));
  const [saving, setSaving] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminIdentification, setAdminIdentification] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminStatus, setAdminStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [adminCertVerification, setAdminCertVerification] = useState<'NONE' | 'PENDING' | 'VERIFIED'>('NONE');

  useEffect(() => {
    UserService.getAll().then(users => {
      const adminsOnly = users.filter(
        u => u.role === 'ADMIN' && u.institutionId === (institution.id)
      );
      setAdmins(adminsOnly);
    });
  }, [institution]);

  const handleCreateAdmin = async () => {
    if (
      !adminFirstName.trim() ||
      !adminLastName.trim() ||
      !adminEmail.trim() ||
      !adminPassword.trim() ||
      !adminIdentification.trim() ||
      !adminPhone.trim()
    ) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      const newAdmin = await UserService.create({
        firstName: adminFirstName.trim(),
        lastName: adminLastName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        role: 'ADMIN',
        institutionId: institution.id,
        identification: adminIdentification.trim(),
        phoneNumber: adminPhone,

      });

      setAdmins(prev => [...prev, newAdmin]);

      setSelectedAdmins(prev => [
        ...prev,
        newAdmin.uid,
      ]);

      setAdminFirstName('');
      setAdminLastName('');
      setAdminEmail('');
      setAdminPassword('');

      setShowCreateAdmin(false);

      toast.success('Administrador creado');
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : 'Error al crear administrador'
      );
    }
  };

  const removeAdmin = (uid: string) => {
    setAdmins(prev =>
      prev.filter(admin => admin.uid !== uid)
    );

    setSelectedAdmins(prev =>
      prev.filter(id => id !== uid)
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (!institution.id) {
        toast.error('La institución no tiene ID');
        return;
      }
      await InstitutionService.update(institution.id, {
        name: name.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        mode,
        maxStudents: parseInt(maxStudents, 10) || 100,
        maxInstructors: parseInt(maxInstructors, 10) || 5,
        maxDevices: parseInt(maxDevices, 10) || 10,
        adminIds: selectedAdmins,
        primaryAdminId: selectedAdmins[0] || undefined,
      });
      const previousAdmins = institution.adminIds || [];
      const addedAdmins = selectedAdmins.filter(id => !previousAdmins.includes(id));
      const removedAdmins = previousAdmins.filter(id => !selectedAdmins.includes(id));

      for (const uid of addedAdmins) {
        await UserService.update(uid, {
          role: 'ADMIN',
          institutionId: institution.id,
          memberships: [institution.id],
        });
      }

      for (const uid of removedAdmins) {
        const user = await UserService.get(uid);

        if (!user) continue;
        const memberships = (user.memberships || []).filter(id => id !== institution.id);

        await UserService.update(uid, {
          memberships,
          institutionId: memberships[0] || '',
        });

      }
      toast.success('Institución actualizada');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)',
        borderRadius: 28, padding: 32, zIndex: 201, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Editar Institución</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{institution.id}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--bg-surface-2)', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Nombre de la institución" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, }}>
                <label style={labelStyle}>Administradores</label>
                <button type="button" onClick={() => setShowCreateAdmin(!showCreateAdmin)} style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12, }}><Plus size={14} /> Crear admin</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {admins.map(admin => (
                  <div key={admin.uid} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{admin.firstName}{' '} {admin.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', }}>{admin.email}</div>
                    </div>

                    <button type="button" onClick={() => removeAdmin(admin.uid)} style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {showCreateAdmin && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 16, background: 'var(--bg-surface-2)', }}>
                <h4 style={{ marginTop: 0, marginBottom: 14, fontSize: 14, fontWeight: 800, }}>Nuevo administrador</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <input placeholder='Nombre' value={adminFirstName} onChange={e => setAdminFirstName(e.target.value)} style={inputStyle} />
                  <input placeholder='Apellido' value={adminLastName} onChange={e => setAdminLastName(e.target.value)} style={inputStyle} />
                  <input placeholder='Identificación' value={adminIdentification} onChange={e => setAdminIdentification(e.target.value)} style={inputStyle} />
                  <input
                    placeholder="Teléfono"
                    value={adminPhone}
                    onChange={e => setAdminPhone(e.target.value)}
                    style={inputStyle}
                  />

                  <input type='email' placeholder='Correo' value={adminEmail} onChange={e => setAdminEmail(e.target.value)} style={inputStyle} />
                  <input type='password' placeholder='Contraseña' value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={inputStyle} />
                </div>


                <button type='button' onClick={handleCreateAdmin} style={{ ...btnPrimary, width: '100%', marginTop: 14, }}>
                  Crear administrador
                </button>
              </div>
            )}
            <div>
              <label style={labelStyle}>Modo de operación</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {([
                  { value: 'AUTOMATED' as InstitutionMode, icon: <Zap size={16} />, label: 'Automatizado', desc: 'Genera grupos automáticamente' },
                  { value: 'MANUAL' as InstitutionMode, icon: <Settings size={16} />, label: 'Manual', desc: 'Admin gestiona cursos a mano' },
                ] as const).map(opt => (
                  <div key={opt.value} onClick={() => setMode(opt.value)} style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${mode === opt.value ? 'var(--brand)' : 'var(--border)'}`,
                    background: mode === opt.value ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'var(--bg-surface-2)',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: mode === opt.value ? 'var(--brand)' : 'var(--text-secondary)' }}>
                      {opt.icon}
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Email contacto</label>
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={inputStyle} placeholder="admin@institucion.com" />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={inputStyle} placeholder="+57 300 000 0000" />
              </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Máx. Estudiantes</label>
                <input type="number" min="1" value={maxStudents} onChange={e => setMaxStudents(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Máx. Instructores</label>
                <input type="number" min="1" value={maxInstructors} onChange={e => setMaxInstructors(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Máx. Dispositivos</label>
                <input type="number" min="0" value={maxDevices} onChange={e => setMaxDevices(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ institution, onClose, onDeleted }: {
  institution: Institution; onClose: () => void; onDeleted: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm !== institution.id) { toast.error('El código no coincide'); return; }
    setDeleting(true);
    try {
      await InstitutionService.remove(institution.id);
      toast.success('Institución eliminada');
      onDeleted(institution.id);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 420, background: 'var(--bg-surface)', borderRadius: 24, padding: 28, zIndex: 201,
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.3)',
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#ef4444' }}>
            <Trash2 size={22} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>¿Eliminar institución?</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Esta acción es <strong>irreversible</strong>. Se eliminará <strong>{institution.name}</strong> y todos sus datos asociados.
          </p>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ ...labelStyle, color: '#ef4444' }}>
            Escribe el código <code style={{ background: 'var(--bg-surface-2)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{institution.id}</code> para confirmar
          </label>
          <input
            value={confirm} onChange={e => setConfirm(e.target.value)}
            style={{ ...inputStyle, border: '1px solid rgba(239,68,68,0.4)' }}
            placeholder={institution.id}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button
            onClick={handleDelete}
            disabled={deleting || confirm !== institution.id}
            style={{ ...btnPrimary, background: '#ef4444', opacity: (deleting || confirm !== institution.id) ? 0.5 : 1, cursor: (deleting || confirm !== institution.id) ? 'not-allowed' : 'pointer' }}
          >
            {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({ plans, onClose, onCreated }: { plans: Plan[]; onClose: () => void; onCreated: () => void }) {

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [mode, setMode] = useState<InstitutionMode>('MANUAL');
  const [plan, setPlan] = useState(plans[0]?.slug || 'pyme');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [typeOfInstitution, setTypeOfInstitution] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [country, setCountry] = useState('Colombia');
  const [creating, setCreating] = useState(false);
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminIdentification, setAdminIdentification] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [adminCity, setAdminCity] = useState('');
  const [adminDepartment, setAdminDepartment] = useState('');
  const [adminCountry, setAdminCountry] = useState('Colombia');

  const municipios = getMunicipalities(department);


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      toast.error('Código y nombre son requeridos');
      return;
    }
    if (!department.trim()) {
      toast.error('Departamento requerido');
      return;
    }

    if (!city.trim()) {
      toast.error('Ciudad requerida');
      return;
    }

    if (!adminEmail.trim()) {
      toast.error('Email del administrador requerido');
      return;
    }

    if (!adminPassword.trim()) {
      toast.error('Contraseña del administrador requerida');
      return;
    }
    if (!adminIdentification.trim()) {
      toast.error('Identificación requerida');
      return;
    }
    setCreating(true);
    try {
      const institutionId = code.trim().toUpperCase();

      const InstitutionData: CreateInstitutionInput = {
        name: name.trim(), code: code.trim().toUpperCase(),
        nit: nit,
        mode,
        planType: plan as InstitutionPlan,
        status: 'pending',
        address: address,
        city: city,
        department: department,
        type: typeOfInstitution,
        country: 'Colombia',
        activeCoursesCount: 0,
        totalSessionsCount: 0,
        memberCount: 1,
        maxDevices: 10, maxInstructors: 5, maxStudents: 100,
        createdBy: 'SuperAdmin',
        contactEmail: email.trim() || undefined,
        contactPhone: phone.trim() || undefined,
        config: {},
        adminIds: [],
      };
      await InstitutionService.create(
        InstitutionData.code,
        InstitutionData
      );
      const admin = await UserService.create({
        email: adminEmail.trim(),
        password: adminPassword,
        firstName: adminFirstName.trim(),
        lastName: adminLastName.trim(),
        identification: adminIdentification.trim(),
        phoneNumber: adminPhone.trim(),
        role: 'ADMIN',
        address: adminAddress,
        city: adminCity,
        department: adminDepartment,
        country: adminCountry,
        institutionId,
      });
      await InstitutionService.update(institutionId, {
        primaryAdminId: admin.uid,
        adminIds: [admin.uid],
      });

      toast.success('Institución creada exitosamente');

      onCreated();

      onClose();

    } catch (error) {

      console.error(error);

      toast.error('Error al crear la institución');

    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)',
        borderRadius: 28, padding: 32, zIndex: 201, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Nueva Institución</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--bg-surface-2)', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Código *</label>
                <input required placeholder="JOMAR-SEGURIDAD" value={code} onChange={e => setCode(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input required placeholder="Jomar Seguridad" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tipo de Institución *</label>
                <SearchableSelect
                  value={typeOfInstitution}
                  onChange={setTypeOfInstitution}
                  options={TIPOS_INSTITUCION}
                  placeholder="Tipo de institución"
                />
              </div>
              <div>
                <label style={labelStyle}>Nit *</label>
                <input required placeholder="Nit" value={nit} onChange={e => setNit(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email contacto*</label>
                <input type="email" placeholder="admin@institucion.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono contacto*</label>
                <input placeholder="+57 300 000 0000" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Departamento *</label>

                <SearchableSelect
                  value={department}
                  onChange={(v) => {
                    setDepartment(v);
                    setCity('');
                  }}
                  options={COLOMBIA_DEPARTMENTS}
                  placeholder="Buscar departamento..."
                />
              </div>

              <div>
                <label style={labelStyle}>Ciudad / Municipio *</label>

                <SearchableSelect
                  value={city}
                  onChange={setCity}
                  options={municipios}
                  placeholder={
                    department
                      ? 'Buscar municipio...'
                      : 'Selecciona un departamento'
                  }
                  disabled={!department}
                />
              </div>
              <div >
                <label style={labelStyle}>Dirección</label>
                <input placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
              </div>

            </div>

            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 16,
              background: 'var(--bg-surface-2)',
            }}>
              <h4 style={{
                margin: '0 0 16px',
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}>
                Administrador Principal
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}>
                <div>
                  <label style={labelStyle}>Nombres *</label>
                  <input
                    required
                    value={adminFirstName}
                    onChange={e => setAdminFirstName(e.target.value)}
                    placeholder="Juan"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Apellidos *</label>
                  <input
                    required
                    value={adminLastName}
                    onChange={e => setAdminLastName(e.target.value)}
                    placeholder="Pérez"
                    style={inputStyle}
                  />
                </div>


                <div>
                  <label style={labelStyle}>Identificación *</label>
                  <input
                    required
                    value={adminIdentification}
                    onChange={e => setAdminIdentification(e.target.value)}
                    placeholder="123456789"
                    style={inputStyle}
                  />
                </div>


                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input placeholder="+57 300 000 0000" value={adminPhone} onChange={e => setAdminPhone(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Departamento *</label>

                  <SearchableSelect
                    value={adminDepartment}
                    onChange={(v) => {
                      setAdminDepartment(v);
                      setAdminCity('');
                    }}
                    options={COLOMBIA_DEPARTMENTS}
                    placeholder="Buscar departamento..."
                  />
                </div>

                <div>
                  <label style={labelStyle}>Ciudad / Municipio *</label>

                  <SearchableSelect
                    value={adminCity}
                    onChange={setAdminCity}
                    options={municipios}
                    placeholder={
                      adminDepartment
                        ? 'Buscar municipio...'
                        : 'Selecciona un departamento'
                    }
                    disabled={!adminDepartment}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Dirección</label>
                  <input placeholder="Dirección" value={adminAddress} onChange={e => setAdminAddress(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input
                    required
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@empresa.com"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contraseña *</label>
                  <input
                    required
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="********"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Plan inicial</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {plans.slice(0, 6).map(p => (
                  <button key={p.slug} type="button" onClick={() => setPlan(p.slug)} style={{
                    padding: '8px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    border: `2px solid ${plan === p.slug ? 'var(--brand)' : 'var(--border)'}`,
                    background: plan === p.slug ? 'color-mix(in srgb, var(--brand) 10%, transparent)' : 'var(--bg-surface-2)',
                    color: plan === p.slug ? 'var(--brand)' : 'var(--text-secondary)',
                    transition: 'all 0.15s', textAlign: 'center',
                  }}>{p.name}<br /><span style={{ fontSize: 10, opacity: 0.8 }}>{formatPrice(p.priceCOP)}</span></button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Modo de operación</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {([
                  { value: 'AUTOMATED' as InstitutionMode, icon: <Zap size={16} />, label: 'Automatizado', desc: 'Genera grupos automáticamente' },
                  { value: 'MANUAL' as InstitutionMode, icon: <Settings size={16} />, label: 'Manual', desc: 'Admin gestiona cursos a mano' },
                ] as const).map(opt => (
                  <div key={opt.value} onClick={() => setMode(opt.value)} style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${mode === opt.value ? 'var(--brand)' : 'var(--border)'}`,
                    background: mode === opt.value ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'var(--bg-surface-2)',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: mode === opt.value ? 'var(--brand)' : 'var(--text-secondary)' }}>
                      {opt.icon}
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>



            <button type="submit" disabled={creating} style={{ ...btnPrimary, width: '100%', height: 48, opacity: creating ? 0.7 : 1, cursor: creating ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: 4 }}>
              {creating ? 'Creando...' : 'Crear Institución'}
            </button>
          </div>
        </form >
      </div >

    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignPlanTarget, setAssignPlanTarget] = useState<Institution | null>(null);
  const [changeStatusTarget, setChangeStatusTarget] = useState<Institution | null>(null);
  const [editTarget, setEditTarget] = useState<Institution | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Institution | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, planData] = await Promise.all([
        InstitutionService.getAll(),
        PlanService.getAll(),
      ]);
      setInstitutions(data);
      setPlans(planData.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      console.error('Error loading:', err);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePlanSaved = (id: string, newPlan: string) =>
    setInstitutions(prev => prev.map(i => i.id === id ? { ...i, plan: newPlan as never } : i));

  const handleStatusSaved = (id: string, newStatus: InstitutionStatus) =>
    setInstitutions(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

  const handleDeleted = (id: string) =>
    setInstitutions(prev => prev.filter(i => i.id !== id));

  const filtered = institutions.filter(
    (inst) =>
      searchTerm === '' ||
      (inst.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.id || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-page)' }}>
      <Header title="Gestión de Instituciones" />

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <PageHero
          title="Instituciones"
          subtitle={`Gestión multi-tenant: ${institutions.length} instituciones registradas`}
          parentTitle="Super Admin"
          parentHref="/super-admin/dashboard"
          actions={
            <button onClick={() => setShowCreateModal(true)} style={{ ...btnPrimary, gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <Plus size={16} /> Nueva Institución
            </button>
          }
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Instituciones', value: institutions.length, icon: Building2, color: 'var(--brand)' },
            { label: 'Activas', value: institutions.filter(i => i.status === 'active').length, icon: CheckCircle2, color: '#10B981' },
            { label: 'Automatizadas', value: institutions.filter(i => i.mode === 'AUTOMATED').length, icon: Zap, color: '#6366F1' },
            { label: 'Manuales', value: institutions.filter(i => i.mode !== 'AUTOMATED').length, icon: Settings, color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `color-mix(in srgb, ${s.color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.icon size={20} /></div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{loading ? '...' : s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Institution Cards */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                placeholder="Buscar institución..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 48 }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 200, background: 'var(--bg-surface-2)', borderRadius: 16, border: '1px solid var(--border)', opacity: 0.5 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Building2 size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No se encontraron instituciones</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
              {filtered.map((inst) => {
                const meta = planMeta(inst.planType);
                const isAuto = inst.mode === 'AUTOMATED';

                return (
                  <div key={inst.id} style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20,
                    padding: 20, transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: isAuto ? 'rgba(99,102,241,0.1)' : 'color-mix(in srgb, var(--brand) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAuto ? '#6366F1' : 'var(--brand)' }}>
                          {isAuto ? <Zap size={22} /> : <Building2 size={22} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.name}</h4>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>{inst.id}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: isAuto ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', color: isAuto ? '#6366F1' : '#D97706' }}>
                              {isAuto ? '⚡ AUTO' : '✏️ MANUAL'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                        <button
                          onClick={() => setChangeStatusTarget(inst)}
                          title="Cambiar estado"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          <StatusBadge status={inst.status || 'pending'} />
                        </button>
                        <button
                          onClick={() => setEditTarget(inst)}
                          title="Editar institución"
                          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(inst)}
                          title="Eliminar institución"
                          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'var(--bg-surface-2)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
                      {[
                        { icon: Users, value: inst.maxStudents || 0, label: 'Est. máx.' },
                        { icon: GraduationCap, value: inst.maxInstructors || 0, label: 'Inst. máx.' },
                        { icon: Cpu, value: inst.maxDevices || 0, label: 'Disp. máx.' },
                      ].map(({ icon: Icon, value, label }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <Icon size={13} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Plan row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CreditCard size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: meta.bg, color: meta.text }}>
                          {meta.label}
                        </span>
                      </div>
                      <button
                        onClick={() => setAssignPlanTarget(inst)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--brand)', background: 'color-mix(in srgb, var(--brand) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--brand) 20%, transparent)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--brand) 15%, transparent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'; }}
                      >
                        <ChevronDown size={13} /> Cambiar plan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && <CreateModal plans={plans} onClose={() => setShowCreateModal(false)} onCreated={loadData} />}
      {assignPlanTarget && <AssignPlanModal institution={assignPlanTarget} plans={plans} onClose={() => setAssignPlanTarget(null)} onSaved={handlePlanSaved} />}
      {changeStatusTarget && <ChangeStatusModal institution={changeStatusTarget} onClose={() => setChangeStatusTarget(null)} onSaved={handleStatusSaved} />}
      {editTarget && <EditModal institution={editTarget} onClose={() => setEditTarget(null)} onSaved={loadData} />}
      {deleteTarget && <DeleteModal institution={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}
    </div>
  );
}
