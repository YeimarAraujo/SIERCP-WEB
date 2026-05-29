/**
 * Lista canónica de escenarios clínicos SIERCP.
 * ÚNICA fuente de verdad para Web — Flutter usa ClinicalScenarios en Dart.
 *
 * Estos valores deben coincidir con los strings almacenados en Firestore
 * y con el enum ScenarioCategory de alert_course.dart.
 */

export const CLINICAL_SCENARIOS = {
  PARO_CARDIACO:       'paroCardiaco',
  INFARTO:             'infarto',
  PEDIATRICO:          'pediatrico',
  AHOGAMIENTO:         'ahogamiento',
  ACCIDENTE_TRANSITO:  'accidenteTransito',
  COLAPSO_EJERCICIO:   'colapsoEjercicio',
  ATRAGANTAMIENTO:     'atragantamiento',
  DESCARGA_ELECTRICA:  'descargaElectrica',
  SOBREDOSIS:          'sobredosis',
  QUEMADURA:           'quemadura',
} as const;

export type ClinicalScenario = typeof CLINICAL_SCENARIOS[keyof typeof CLINICAL_SCENARIOS];

export const ALL_CLINICAL_SCENARIOS: ClinicalScenario[] = Object.values(CLINICAL_SCENARIOS);

export const CLINICAL_SCENARIO_LABELS: Record<ClinicalScenario, string> = {
  paroCardiaco:      'Paro Cardíaco',
  infarto:           'Infarto Agudo',
  pediatrico:        'RCP Pediátrico / Lactante',
  ahogamiento:       'Ahogamiento',
  accidenteTransito: 'Accidente de Tránsito',
  colapsoEjercicio:  'Colapso por Ejercicio',
  atragantamiento:   'Atragantamiento (OVACE)',
  descargaElectrica: 'Descarga Eléctrica',
  sobredosis:        'Sobredosis / Opioides',
  quemadura:         'Quemadura',
};

export const CLINICAL_SCENARIO_DIFFICULTY: Record<ClinicalScenario, 'Básico' | 'Intermedio' | 'Avanzado'> = {
  paroCardiaco:      'Básico',
  infarto:           'Avanzado',
  pediatrico:        'Intermedio',
  ahogamiento:       'Intermedio',
  accidenteTransito: 'Intermedio',
  colapsoEjercicio:  'Básico',
  atragantamiento:   'Básico',
  descargaElectrica: 'Intermedio',
  sobredosis:        'Avanzado',
  quemadura:         'Básico',
};

/** Mapeo de strings legacy (Firestore) a valores canónicos — backward compat. */
export const LEGACY_SCENARIO_MAP: Record<string, ClinicalScenario> = {
  cardiac:      'paroCardiaco',
  drowning:     'ahogamiento',
  accident:     'accidenteTransito',
  pediatric:    'pediatrico',
  electrocution: 'descargaElectrica',
};

/** Normaliza cualquier string (legacy o canónico) al valor canónico. */
export function normalizeScenario(raw: string): ClinicalScenario {
  if (ALL_CLINICAL_SCENARIOS.includes(raw as ClinicalScenario)) {
    return raw as ClinicalScenario;
  }
  return LEGACY_SCENARIO_MAP[raw] ?? 'paroCardiaco';
}
