'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import {
  BookOpen, Users, Calendar, Plus, ChevronRight,
  Search, RefreshCw, Zap, Clock, DollarSign,
  CheckCircle2, AlertCircle, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth-store';

interface TemplateWithCohorts {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  priceCOP: number;
  isAutomated: boolean;
  isActive: boolean;
  icon: string;
  modules: any[];
  cohorts: any[];
  availableSlots: number;
}

export default function AdminPlatformCoursesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [templates, setTemplates] = useState<TemplateWithCohorts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const idToken = await getIdToken();
      const res = await fetch('/api/admin/courses', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (data.templates) {
        // Also fetch cohorts for each template
        const cohortsRes = await fetch('/api/admin/cohorts', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const cohortsData = await cohortsRes.json();
        const cohortsByTemplate: Record<string, any[]> = {};
        for (const c of cohortsData.cohorts || []) {
          if (!cohortsByTemplate[c.templateId]) cohortsByTemplate[c.templateId] = [];
          cohortsByTemplate[c.templateId].push(c);
        }

        setTemplates(
          data.templates.map((t: any) => ({
            ...t,
            cohorts: cohortsByTemplate[t.id] || [],
            availableSlots: (cohortsByTemplate[t.id] || [])
              .filter((c: any) => c.status === 'OPEN')
              .reduce((sum: number, c: any) => sum + (c.maxStudents - c.enrolledCount), 0),
          })),
        );
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast.error('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filtered = templates.filter(
    (t) =>
      searchTerm === '' ||
      (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.slug || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalEnrolled = templates.reduce(
    (sum, t) => sum + t.cohorts.reduce((s: number, c: any) => s + (c.enrolledCount || 0), 0),
    0,
  );
  const openCohorts = templates.reduce(
    (sum, t) => sum + t.cohorts.filter((c: any) => c.status === 'OPEN').length,
    0,
  );
  const automatedCount = templates.filter((t) => t.isAutomated).length;

  const columns = [
    {
      key: 'title',
      label: 'Curso / Programa',
      render: (_: any, row: TemplateWithCohorts) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: row.isAutomated ? '#EEF2FF' : '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: row.isAutomated ? '#6366F1' : '#1800AD',
            }}
          >
            {row.isAutomated ? <Zap size={20} /> : <BookOpen size={20} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{row.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span
                style={{
                  fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20,
                  background: row.isAutomated ? '#EEF2FF' : '#FEF3C7',
                  color: row.isAutomated ? '#4338CA' : '#92400E',
                  letterSpacing: '0.05em',
                }}
              >
                {row.isAutomated ? '⚡ AUTOMÁTICO' : '✏️ MANUAL'}
              </span>
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                {row.modules?.length || 0} módulos
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'cohorts',
      label: 'Grupos',
      render: (_: any, row: TemplateWithCohorts) => {
        const open = row.cohorts.filter((c: any) => c.status === 'OPEN').length;
        const total = row.cohorts.length;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={14} style={{ color: '#94A3B8' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{total}</div>
              <div style={{ fontSize: 10, color: open > 0 ? '#10B981' : '#94A3B8', fontWeight: 700 }}>
                {open} abierto{open !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'enrolledCount',
      label: 'Inscritos',
      render: (_: any, row: TemplateWithCohorts) => {
        const enrolled = row.cohorts.reduce((s: number, c: any) => s + (c.enrolledCount || 0), 0);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Users size={14} style={{ color: '#94A3B8' }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{enrolled}</div>
          </div>
        );
      },
    },
    {
      key: 'priceCOP',
      label: 'Precio',
      render: (val: any) => (
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (val: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {val ? <CheckCircle2 size={14} style={{ color: '#10B981' }} /> : <AlertCircle size={14} style={{ color: '#CBD5E1' }} />}
          <span
            style={{
              fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 20,
              background: val ? '#DCFCE7' : '#F1F5F9',
              color: val ? '#166534' : '#64748B',
            }}
          >
            {val ? 'ACTIVO' : 'INACTIVO'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: () => <ChevronRight size={18} style={{ color: '#CBD5E1' }} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
      <Header title="Gestión de Cursos — Plataforma LMS" />

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <PageHero
          title="Oferta Formativa"
          subtitle={`Gestión de plantillas de cursos y grupos de inscripción (${templates.length} cursos)`}
          parentTitle="Admin"
          parentHref="/admin/dashboard"
          actions={
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={fetchTemplates}
                style={{
                  padding: '10px 16px', borderRadius: 12, background: '#FFFFFF',
                  color: '#64748B', border: '1px solid #E2E8F0', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <RefreshCw size={14} /> Actualizar
              </button>
              <button
                onClick={() => router.push('/admin/platform-courses/new')}
                style={{
                  padding: '10px 20px', borderRadius: 12, background: '#1800AD',
                  color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)',
                }}
              >
                <Plus size={16} /> Crear Curso
              </button>
            </div>
          }
        />

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Cursos Activos', value: templates.filter((t) => t.isActive).length, icon: BookOpen, color: '#1800AD' },
            { label: 'Grupos Abiertos', value: openCohorts, icon: Calendar, color: '#10B981' },
            { label: 'Total Inscritos', value: totalEnrolled, icon: Users, color: '#F59E0B' },
            { label: 'Automatizados', value: automatedCount, icon: Zap, color: '#6366F1' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div
                style={{
                  width: 40, height: 40, borderRadius: 10, background: `${s.color}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
                }}
              >
                <s.icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
                  {loading ? '...' : s.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div
          style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24,
            padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
            <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Buscar por nombre o slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14,
                  border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#F8FAFC',
                }}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            onRowClick={(row) => router.push(`/admin/platform-courses/${row.id}`)}
            emptyMessage="No hay cursos configurados. Crea uno nuevo o ejecuta el seed de Jomar."
          />
        </div>
      </div>
    </div>
  );
}

async function getIdToken(): Promise<string> {
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No autenticado');
  return currentUser.getIdToken();
}
