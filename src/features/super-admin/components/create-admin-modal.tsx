'use client';

import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserService } from '@/services/firestore.service';
import type { UserModel } from '@/shared/types/user';
import { SearchableSelect } from '@/app/checkout/_components/ui';
import { COLOMBIA_DEPARTMENTS, getMunicipalities } from '@/data/colombia-geo';
import { DOCUMENT_TYPE_OPTIONS } from '@/shared/constants/document_types';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  borderRadius: 12,
  border: '1px solid var(--border)',
  fontSize: 14,
  outline: 'none',
  background: 'var(--bg-surface-2)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 6,
};

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 20px',
  borderRadius: 12,
  background: 'var(--brand)',
  color: 'var(--text-on-brand)',
  border: 'none',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        backdropFilter: 'blur(4px)',
      }}
    />
  );
}

export interface CreateAdminModalProps {
  institutionId: string;
  institutionName: string;
  onClose: () => void;
  onCreated: (newAdmin: UserModel) => void;
}

export function CreateAdminModal({
  institutionId,
  institutionName,
  onClose,
  onCreated,
}: CreateAdminModalProps) {
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminIdentification, setAdminIdentification] = useState('');
  const [adminDocumentType, setAdminDocumentType] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminDepartment, setAdminDepartment] = useState('');
  const [adminCity, setAdminCity] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const municipios = getMunicipalities(adminDepartment);

  const handleCreateAdmin = async () => {
    if (
      !adminFirstName.trim() ||
      !adminLastName.trim() ||
      !adminEmail.trim() ||
      !adminPassword.trim() ||
      !adminConfirmPassword.trim() ||
      !adminIdentification.trim() ||
      !adminDocumentType.trim() ||
      !adminPhone.trim() ||
      !adminDepartment.trim() ||
      !adminCity.trim()
    ) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setSaving(true);
    try {
      const newAdmin = await UserService.create({
        firstName: adminFirstName.trim(),
        lastName: adminLastName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        role: 'ADMIN',
        institutionId: institutionId,
        identification: adminIdentification.trim(),
        documentType: adminDocumentType,
        phoneNumber: adminPhone,
        address: adminAddress.trim() || undefined,
        city: adminCity,
        department: adminDepartment,
        country: 'Colombia',
      });

      toast.success('Administrador creado');
      onCreated(newAdmin);
      onClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Error al crear administrador'
      );
    } finally {
      setSaving(false);
    }
  };

  const PasswordInput = ({
    value,
    onChange,
    placeholder,
    show,
    toggleShow,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    show: boolean;
    toggleShow: () => void;
  }) => (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={toggleShow}
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  return (
    <>
      <Backdrop onClick={onClose} />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          borderRadius: 24,
          padding: 28,
          zIndex: 202,
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Nuevo Administrador
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                margin: '4px 0 0',
              }}
            >
              {institutionName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'var(--bg-surface-2)',
              borderRadius: 10,
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombres *</label>
              <input
                placeholder="Juan"
                value={adminFirstName}
                onChange={(e) => setAdminFirstName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Apellidos *</label>
              <input
                placeholder="Pérez"
                value={adminLastName}
                onChange={(e) => setAdminLastName(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Identificación *</label>
              <input
                placeholder="123456789"
                value={adminIdentification}
                onChange={(e) => setAdminIdentification(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tipo de identificación *</label>
              <select
                value={adminDocumentType}
                onChange={(e) => setAdminDocumentType(e.target.value)}
                style={inputStyle}
              >
                <option value="">Seleccionar...</option>
                {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Teléfono</label>
            <input
              placeholder="+57 300 000 0000"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          </div>

          <div>
            <label style={labelStyle}>Dirección</label>
            <input
              placeholder="Dirección"
              value={adminAddress}
              onChange={(e) => setAdminAddress(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                placeholder="admin@empresa.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Contraseña *</label>
              <PasswordInput
                value={adminPassword}
                onChange={setAdminPassword}
                placeholder="********"
                show={showPassword}
                toggleShow={() => setShowPassword((p) => !p)}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirmar contraseña *</label>
            <PasswordInput
              value={adminConfirmPassword}
              onChange={setAdminConfirmPassword}
              placeholder="********"
              show={showConfirmPassword}
              toggleShow={() => setShowConfirmPassword((p) => !p)}
            />
          </div>

          <button
            type="button"
            onClick={handleCreateAdmin}
            disabled={saving}
            style={{
              ...btnPrimary,
              width: '100%',
              marginTop: 6,
              height: 46,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Creando...' : 'Crear administrador'}
          </button>
        </div>
      </div>
    </>
  );
}
