/**
 * Tipos de institución admitidos en SIERCP.
 * Reutilizable en formularios de registro de institución y filtros SA.
 */

export const INSTITUTION_TYPES = {
  EMPRESA:       'empresa',
  HOSPITAL:      'hospital',
  CLINICA:       'clinica',
  UNIVERSIDAD:   'universidad',
  COLEGIO:       'colegio',
  BRIGADA:       'brigada',
  BOMBEROS:      'bomberos',
  CRUZ_ROJA:     'cruz_roja',
  DEFENSA_CIVIL: 'defensa_civil',
  OTRO:          'otro',
} as const;

export type InstitutionType = typeof INSTITUTION_TYPES[keyof typeof INSTITUTION_TYPES];

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  empresa:       'Empresa / Organización',
  hospital:      'Hospital / Clínica Hospitalaria',
  clinica:       'Clínica',
  universidad:   'Universidad / IES',
  colegio:       'Colegio / Instituto',
  brigada:       'Brigada de Emergencias',
  bomberos:      'Cuerpo de Bomberos',
  cruz_roja:     'Cruz Roja',
  defensa_civil: 'Defensa Civil',
  otro:          'Otro',
};

export const INSTITUTION_TYPE_OPTIONS = Object.entries(INSTITUTION_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as InstitutionType, label })
);
