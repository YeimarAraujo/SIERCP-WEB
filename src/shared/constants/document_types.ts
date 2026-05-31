
export const DOCUMENT_TYPES = {
  CC: 'CC',
  CE: 'CE',
  TI: 'TI',
  PAS: 'PAS',
  NIT: 'NIT',
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CC: 'Cédula de Ciudadanía',
  CE: 'Cédula de Extranjería',
  TI: 'Tarjeta de Identidad',
  PAS: 'Pasaporte',
  NIT: 'NIT',
};

export const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as DocumentType, label })
);
