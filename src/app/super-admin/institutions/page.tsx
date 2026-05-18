'use client';

import { useEffect, useState } from 'react';
import { InstitutionService } from '@/services/institution.service';
import type { Institution, InstitutionMode } from '@/shared/types/institution';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
  Building2, Plus, Users, Cpu, GraduationCap, Shield,
  CheckCircle2, AlertCircle, Clock, Zap, Settings, Search,
  ChevronRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ─── Create form ─────────────────────────────────────
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState<InstitutionMode>('MANUAL');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadInstitutions = async () => {
    try {
      const data = await InstitutionService.getAll();
      setInstitutions(data);
    } catch (err) {
      console.error('Error loading institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInstitutions(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) {
      toast.error('Código y nombre son requeridos');
      return;
    }
    try {
      setCreating(true);
      await InstitutionService.create(newCode, {
        name: newName,
        code: newCode,
        adminIds: [],
        plan: 'basic',
        status: 'pending',
        maxDevices: 10,
        maxInstructors: 5,
        maxStudents: 100,
        createdBy: '',
        mode: newMode,
        contactEmail: newEmail || undefined,
        contactPhone: newPhone || undefined,
        description: newDescription || undefined,
      } as any);
      toast.success('Institución creada exitosamente');
      setNewCode(''); setNewName(''); setNewMode('MANUAL');
      setNewEmail(''); setNewPhone(''); setNewDescription('');
      setShowCreateModal(false);
      loadInstitutions();
    } catch (err) {
      console.error('Error creating institution:', err);
      toast.error('Error al crear la institución');
    } finally {
      setCreating(false);
    }
  };

  const filtered = institutions.filter(
    (inst) =>
      searchTerm === '' ||
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const statusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle2 size={14} style={{ color: '#10B981' }} />;
    if (status === 'pending') return <Clock size={14} style={{ color: '#F59E0B' }} />;
    return <AlertCircle size={14} style={{ color: '#EF4444' }} />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      active: { bg: '#DCFCE7', color: '#166534', label: 'ACTIVA' },
      pending: { bg: '#FEF3C7', color: '#92400E', label: 'PENDIENTE' },
      suspended: { bg: '#FEE2E2', color: '#991B1B', label: 'SUSPENDIDA' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        fontSize: 9, fontWeight: 900, padding: '3px 10px', borderRadius: 20,
        background: s.bg, color: s.color, letterSpacing: '0.05em',
      }}>{s.label}</span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
      <Header title="Gestión de Instituciones" />

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <PageHero
          title="Instituciones"
          subtitle={`Gestión multi-tenant: ${institutions.length} instituciones registradas`}
          parentTitle="Super Admin"
          parentHref="/super-admin/dashboard"
          actions={
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 20px', borderRadius: 12, background: '#1800AD',
                color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)',
              }}
            ><Plus size={16} /> Nueva Institución</button>
          }
        />

        {/* ─── Stats ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Instituciones', value: institutions.length, icon: Building2, color: '#1800AD' },
            { label: 'Activas', value: institutions.filter(i => (i as any).status === 'active').length, icon: CheckCircle2, color: '#10B981' },
            { label: 'Automatizadas', value: institutions.filter(i => (i as any).mode === 'AUTOMATED').length, icon: Zap, color: '#6366F1' },
            { label: 'Manuales', value: institutions.filter(i => (i as any).mode !== 'AUTOMATED').length, icon: Settings, color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: `${s.color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
              }}><s.icon size={20} /></div>
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
                  {loading ? '...' : s.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Institution Cards ────────────────────────────── */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24,
          padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                placeholder="Buscar institución..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', height: 44, padding: '0 16px 0 48px', borderRadius: 12,
                  border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#F8FAFC',
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 140, background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
              <Building2 size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No se encontraron instituciones</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
              {filtered.map((inst) => (
                <div key={inst.id} style={{
                  background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20,
                  padding: 22, transition: 'all 0.3s', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1800AD';
                  e.currentTarget.style.boxShadow = '0 8px 16px -6px rgba(24,0,173,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: (inst as any).mode === 'AUTOMATED' ? '#EEF2FF' : '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: (inst as any).mode === 'AUTOMATED' ? '#6366F1' : '#1800AD',
                      }}>
                        {(inst as any).mode === 'AUTOMATED' ? <Zap size={24} /> : <Building2 size={24} />}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{inst.name}</h4>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                            background: '#F1F5F9', color: '#64748B',
                          }}>{inst.id}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                            background: (inst as any).mode === 'AUTOMATED' ? '#EEF2FF' : '#FEF3C7',
                            color: (inst as any).mode === 'AUTOMATED' ? '#4338CA' : '#92400E',
                          }}>
                            {(inst as any).mode === 'AUTOMATED' ? '⚡ AUTO' : '✏️ MANUAL'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {statusBadge((inst as any).status || 'pending')}
                  </div>

                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                    background: '#F8FAFC', borderRadius: 12, padding: '10px 14px',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <Users size={14} style={{ color: '#94A3B8', marginBottom: 2 }} />
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{(inst as any).maxStudents || 0}</div>
                      <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700 }}>Estudiantes</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <GraduationCap size={14} style={{ color: '#94A3B8', marginBottom: 2 }} />
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{(inst as any).maxInstructors || 0}</div>
                      <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700 }}>Instructores</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Cpu size={14} style={{ color: '#94A3B8', marginBottom: 2 }} />
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{(inst as any).maxDevices || 0}</div>
                      <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700 }}>Dispositivos</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Create Modal ────────────────────────────────────── */}
      {showCreateModal && (
        <>
          <div
            onClick={() => setShowCreateModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 520, maxHeight: '85vh', overflowY: 'auto', background: '#FFFFFF',
            borderRadius: 28, padding: 32, zIndex: 101,
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Nueva Institución</h3>
              <button onClick={() => setShowCreateModal(false)} style={{
                border: 'none', background: '#F1F5F9', borderRadius: 10,
                width: 32, height: 32, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#64748B',
              }}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>Código *</label>
                    <input
                      required placeholder="JOMAR-SEGURIDAD"
                      value={newCode} onChange={(e) => setNewCode(e.target.value)}
                      style={{
                        width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
                        border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#F8FAFC',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>Nombre *</label>
                    <input
                      required placeholder="Jomar Seguridad"
                      value={newName} onChange={(e) => setNewName(e.target.value)}
                      style={{
                        width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
                        border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#F8FAFC',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>Modo de operación</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { value: 'AUTOMATED' as InstitutionMode, icon: <Zap size={18} />, label: 'Automatizado', desc: 'Genera grupos automáticamente' },
                      { value: 'MANUAL' as InstitutionMode, icon: <Settings size={18} />, label: 'Manual', desc: 'Admin gestiona cursos a mano' },
                    ].map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => setNewMode(opt.value)}
                        style={{
                          padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                          border: `2px solid ${newMode === opt.value ? '#1800AD' : '#E2E8F0'}`,
                          background: newMode === opt.value ? '#F5F3FF' : '#FFFFFF',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: newMode === opt.value ? '#1800AD' : '#64748B' }}>
                          {opt.icon}
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0', lineHeight: 1.4 }}>{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>Email contacto</label>
                    <input
                      type="email" placeholder="admin@institucion.com"
                      value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      style={{
                        width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
                        border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#F8FAFC',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>Teléfono</label>
                    <input
                      placeholder="+57 300 000 0000"
                      value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                      style={{
                        width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
                        border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#F8FAFC',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>Descripción</label>
                  <textarea
                    placeholder="Descripción de la institución..."
                    value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                    style={{
                      width: '100%', height: 80, padding: '10px 14px', borderRadius: 12,
                      border: '1px solid #E2E8F0', fontSize: 14, outline: 'none',
                      background: '#F8FAFC', resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    width: '100%', height: 48, borderRadius: 14, background: '#1800AD',
                    color: '#FFFFFF', border: 'none', fontSize: 14, fontWeight: 800,
                    cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)', marginTop: 4,
                  }}
                >
                  {creating ? 'Creando...' : 'Crear Institución'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
