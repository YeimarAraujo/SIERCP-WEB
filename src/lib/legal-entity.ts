/**
 * Datos del responsable del tratamiento (Decreto 1377 de 2013, art. 13).
 * Se muestran en la política de privacidad, el aviso y los términos.
 *
 * PENDIENTE: el NIT y la dirección los debe suministrar la empresa. Mientras
 * falten, la política lo dice abiertamente en lugar de mostrar un dato falso.
 */
export const LEGAL_ENTITY = {
  name: 'JOMAR SEGURID S.A.S.',
  nit: '', // PENDIENTE
  city: 'Valledupar, Cesar, Colombia',
  address: '', // PENDIENTE
  email: 'info@jomarsegurid.co',
  phone: '+57 315 377 8892',
  /** Área que atiende consultas y reclamos (Ley 1581, art. 17 lit. k). */
  privacyOffice: 'Área de Protección de Datos',
  product: 'SICAP',
} as const;

export const pending = (value: string) => value || '[pendiente de publicar]';
