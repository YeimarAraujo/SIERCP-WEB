/**
 * Lista canónica de escenarios clínicos SIERCP.
 * ÚNICA fuente de verdad para Web — Flutter usa ClinicalScenarios en Dart.
 *
 * Estos valores deben coincidir con los strings almacenados en Firestore
 * y con el enum ScenarioCategory de alert_course.dart.
 */

// IDs canónicos — sincronizados con Flutter clinical_scenarios.dart
export const CLINICAL_SCENARIOS = {
  PARO_CARDIACO:            'paroCardiaco',
  INFARTO:                  'infarto',
  PEDIATRICO:               'pediatricoParo',    // antes 'pediatrico' — actualizado
  AHOGAMIENTO:              'ahogamiento',
  ACCIDENTE_TRANSITO:       'accidenteTransito',
  COLAPSO_EJERCICIO:        'colapsoEjercicio',
  ATRAGANTAMIENTO:          'atragantamiento',
  DESCARGA_ELECTRICA:       'descargaElectrica',
  SOBREDOSIS:               'sobredosis',
  AHOGAMIENTO_PEDIATRICO:   'ahogamientoPediatrico',
  RV_NEONATAL:              'rvNeonatal',
  TRAUMA_CRANEO:            'traumaCraneo',
} as const;

export type ClinicalScenario = typeof CLINICAL_SCENARIOS[keyof typeof CLINICAL_SCENARIOS];

export const ALL_CLINICAL_SCENARIOS: ClinicalScenario[] = Object.values(CLINICAL_SCENARIOS);

export const CLINICAL_SCENARIO_LABELS: Record<ClinicalScenario, string> = {
  paroCardiaco:           'Paro Cardíaco en Casa',
  infarto:                'Infarto que Evoluciona a Paro',
  pediatricoParo:         'Paro Cardíaco Pediátrico',
  ahogamiento:            'Ahogamiento en Piscina',
  accidenteTransito:      'Accidente de Tránsito',
  colapsoEjercicio:       'Colapso durante Ejercicio',
  atragantamiento:        'Atragantamiento Severo (OVACE)',
  descargaElectrica:      'Descarga Eléctrica',
  sobredosis:             'Sobredosis por Opioides',
  ahogamientoPediatrico:  'Ahogamiento Pediátrico',
  rvNeonatal:             'Reanimación Neonatal',
  traumaCraneo:           'Trauma Craneoencefálico con Paro',
};

export const CLINICAL_SCENARIO_DIFFICULTY: Record<ClinicalScenario, 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto'> = {
  paroCardiaco:           'Intermedio',
  infarto:                'Avanzado',
  pediatricoParo:         'Experto',
  ahogamiento:            'Avanzado',
  accidenteTransito:      'Avanzado',
  colapsoEjercicio:       'Intermedio',
  atragantamiento:        'Intermedio',
  descargaElectrica:      'Avanzado',
  sobredosis:             'Avanzado',
  ahogamientoPediatrico:  'Experto',
  rvNeonatal:             'Experto',
  traumaCraneo:           'Experto',
};

export const CLINICAL_SCENARIO_PATIENT_TYPE: Record<ClinicalScenario, 'adult' | 'pediatric' | 'infant'> = {
  paroCardiaco:           'adult',
  infarto:                'adult',
  pediatricoParo:         'pediatric',
  ahogamiento:            'adult',
  accidenteTransito:      'adult',
  colapsoEjercicio:       'adult',
  atragantamiento:        'adult',
  descargaElectrica:      'adult',
  sobredosis:             'adult',
  ahogamientoPediatrico:  'pediatric',
  rvNeonatal:             'infant',
  traumaCraneo:           'adult',
};

/** Mapeo de strings legacy (Firestore) a valores canónicos — backward compat. */
export const LEGACY_SCENARIO_MAP: Record<string, ClinicalScenario> = {
  cardiac:      'paroCardiaco',
  drowning:     'ahogamiento',
  accident:     'accidenteTransito',
  pediatric:    'pediatricoParo',
  pediatrico:   'pediatricoParo',    // ← old id normalised
  electrocution: 'descargaElectrica',
  quemadura:    'paroCardiaco',      // quemadura no está en Flutter — mapear a más cercano
};

/** Normaliza cualquier string (legacy o canónico) al valor canónico. */
export function normalizeScenario(raw: string): ClinicalScenario {
  if (ALL_CLINICAL_SCENARIOS.includes(raw as ClinicalScenario)) {
    return raw as ClinicalScenario;
  }
  return LEGACY_SCENARIO_MAP[raw] ?? 'paroCardiaco';
}
